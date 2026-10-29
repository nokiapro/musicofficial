import { ref, set, get, child, update, onValue } from 'firebase/database';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { rtdb, db } from './firebase';
import { Song, AppUser, Playlist, Voucher, SiteSettings } from '../types/music';

const STORAGE_KEY_SONGS = 'xuanken_music_songs_v3';
const STORAGE_KEY_MEMBERS = 'xuanken_music_members_v3';

// Recursively strips all undefined properties from objects/arrays so Firebase never throws "value argument contains undefined"
export function cleanForFirebase<T = any>(obj: any): T {
  if (obj === undefined) return null as any;
  if (obj === null) return null as any;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter((x) => x !== undefined)
      .map((x) => cleanForFirebase(x)) as any;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = cleanForFirebase(val);
    }
  }
  return cleaned as any;
}

export function sanitizeSong(raw: any, idFallback: string): Song {
  return {
    id: raw?.id || idFallback,
    stt: typeof raw?.stt === 'number' ? raw.stt : undefined,
    title: raw?.title || 'Bài Hát Chưa Đặt Tên',
    artists: raw?.artists || 'XuanKen',
    album: raw?.album || 'XuanKen Official',
    duration: typeof raw?.duration === 'number' && raw.duration > 0 ? raw.duration : 210,
    price: typeof raw?.price === 'number' ? raw.price : (Number(raw?.price) || 20000),
    audioFormat: raw?.audioFormat === 'WAV' ? 'WAV' : 'MP3',
    lyrics: Array.isArray(raw?.lyrics) ? raw.lyrics : [],
    lrcRaw: raw?.lrcRaw || '',
    lrcUrl: raw?.lrcUrl || '',
    coverImage: raw?.coverImage || '',
    coverGradient: raw?.coverGradient || 'from-purple-600 to-indigo-800',
    demoUrl: raw?.demoUrl || '',
    mp3Url: raw?.mp3Url || '',
    wavUrl: raw?.wavUrl || '',
    playCount: typeof raw?.playCount === 'number' ? raw.playCount : 0,
    releaseDate: raw?.releaseDate || '',
    plays: raw?.plays || '0 lượt nghe',
  };
}

export const MusicService = {
  // Subscribe to real-time song updates from Firebase RTDB
  subscribeToSongs(onUpdate: (songs: Song[]) => void): () => void {
    try {
      const songsRef = ref(rtdb, 'songs');
      return onValue(
        songsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val() || {};
            const songsArray: Song[] = Object.entries(data)
              .filter(([_, val]: [string, any]) => val && (val.title || val.demoUrl || val.mp3Url || val.wavUrl))
              .map(([key, val]: [string, any]) => sanitizeSong(val, key));
            // Sort by stt or id
            songsArray.sort((a, b) => (a.stt || 0) - (b.stt || 0));
            localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(songsArray));
            onUpdate(songsArray);
          }
        },
        (err) => {
          console.warn('Realtime sync warning (using cache):', err);
        }
      );
    } catch (e) {
      console.warn('Error attaching RTDB listener:', e);
      return () => {};
    }
  },

  // Load songs from Firebase Realtime Database or Firestore, fallback to LocalStorage
  async fetchSongs(): Promise<Song[]> {
    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, 'songs'));
      if (snapshot.exists()) {
        const data = snapshot.val() || {};
        const songsArray: Song[] = Object.entries(data)
          .filter(([_, val]: [string, any]) => val && (val.title || val.demoUrl || val.mp3Url || val.wavUrl))
          .map(([key, val]: [string, any]) => sanitizeSong(val, key));
        songsArray.sort((a, b) => (a.stt || 0) - (b.stt || 0));
        localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(songsArray));
        return songsArray;
      }
    } catch (err) {
      console.warn('Firebase RTDB read notice:', err);
    }

    // Attempt Firestore fallback
    try {
      const colRef = collection(db, 'songs');
      const docsSnap = await getDocs(colRef);
      if (!docsSnap.empty) {
        const songsArray: Song[] = [];
        docsSnap.forEach((d) => {
          const val = d.data();
          if (val && (val.title || val.demoUrl || val.mp3Url || val.wavUrl)) {
            songsArray.push(sanitizeSong(val, d.id));
          }
        });
        songsArray.sort((a, b) => (a.stt || 0) - (b.stt || 0));
        localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(songsArray));
        return songsArray;
      }
    } catch (err) {
      console.warn('Firestore fallback read notice:', err);
    }

    const localCached = localStorage.getItem(STORAGE_KEY_SONGS);
    if (localCached) {
      try {
        const list = JSON.parse(localCached);
        if (Array.isArray(list)) {
          return list
            .filter((s) => s && (s.title || s.demoUrl || s.mp3Url || s.wavUrl))
            .map((s, idx) => sanitizeSong(s, s.id || `cached-${idx}`));
        }
      } catch (e) {
        console.error('Failed to parse cached songs:', e);
      }
    }

    return [];
  },

  // Save all songs to Firebase and LocalStorage with detailed error reporting
  async saveSongsToFirebase(songs: Song[]): Promise<{
    success: boolean;
    rtdb: boolean;
    firestore: boolean;
    error?: string;
  }> {
    const cleanSongs = cleanForFirebase(songs) || [];
    localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(cleanSongs));
    let rtdbSuccess = false;
    let firestoreSuccess = false;
    let lastError = '';

    // 1. Sync to Firebase Realtime Database
    try {
      const songsRef = ref(rtdb, 'songs');
      const songsMap: Record<string, any> = {};
      cleanSongs.forEach((s: Song) => {
        if (s && s.id) {
          songsMap[s.id] = cleanForFirebase(s);
        }
      });
      await set(songsRef, songsMap);
      rtdbSuccess = true;
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      lastError = errMsg;
      console.error('Firebase RTDB saveSongs error:', err);
    }

    // 2. Also sync to Cloud Firestore
    try {
      for (const song of cleanSongs) {
        if (song && song.id) {
          await setDoc(doc(db, 'songs', song.id), cleanForFirebase(song), { merge: true });
        }
      }
      firestoreSuccess = true;
    } catch (err: any) {
      if (!lastError) lastError = err?.message || String(err);
      console.error('Firebase Firestore saveSongs error:', err);
    }

    const overallSuccess = rtdbSuccess || firestoreSuccess;
    return {
      success: overallSuccess,
      rtdb: rtdbSuccess,
      firestore: firestoreSuccess,
      error: overallSuccess ? undefined : lastError,
    };
  },

  // Add or update single song
  async upsertSong(song: Song): Promise<{ success: boolean; rtdb: boolean; firestore: boolean; error?: string }> {
    const clean = cleanForFirebase(song);
    let rtdbSuccess = false;
    let firestoreSuccess = false;
    let lastError = '';

    try {
      const songRef = ref(rtdb, `songs/${song.id}`);
      await set(songRef, clean);
      rtdbSuccess = true;
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error('Firebase RTDB upsert error:', err);
    }

    try {
      await setDoc(doc(db, 'songs', song.id), clean, { merge: true });
      firestoreSuccess = true;
    } catch (err: any) {
      if (!lastError) lastError = err?.message || String(err);
      console.error('Firestore upsert error:', err);
    }

    // Update local storage
    try {
      const local = localStorage.getItem(STORAGE_KEY_SONGS);
      const list: Song[] = local ? JSON.parse(local) : [];
      const idx = list.findIndex((s) => s.id === song.id);
      if (idx >= 0) {
        list[idx] = clean;
      } else {
        list.unshift(clean);
      }
      localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(list));
    } catch (e) {}

    const overallSuccess = rtdbSuccess || firestoreSuccess;
    return {
      success: overallSuccess,
      rtdb: rtdbSuccess,
      firestore: firestoreSuccess,
      error: overallSuccess ? undefined : lastError,
    };
  },

  // Increment playCount for a song in Firebase and sync live
  async incrementPlayCount(songId: string, newCount: number): Promise<boolean> {
    try {
      const songRef = ref(rtdb, `songs/${songId}`);
      await update(songRef, { playCount: newCount });
    } catch (err) {
      console.warn('Firebase RTDB playCount update warning:', err);
    }

    try {
      await setDoc(doc(db, 'songs', songId), { playCount: newCount }, { merge: true });
    } catch (err) {
      console.warn('Firestore playCount update warning:', err);
    }

    try {
      const local = localStorage.getItem(STORAGE_KEY_SONGS);
      if (local) {
        const list: Song[] = JSON.parse(local);
        const updated = list.map((s) => (s.id === songId ? { ...s, playCount: newCount } : s));
        localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(updated));
      }
    } catch (e) {}

    return true;
  },

  // Delete song from RTDB and Firestore
  async deleteSong(songId: string): Promise<boolean> {
    try {
      const songRef = ref(rtdb, `songs/${songId}`);
      await set(songRef, null);
    } catch (err) {
      console.warn('Firebase delete warning:', err);
    }

    try {
      const docRef = doc(db, 'songs', songId);
      await setDoc(docRef, { deleted: true }, { merge: true });
    } catch (e) {}

    return true;
  },

  // Members Management
  async fetchMembers(): Promise<AppUser[]> {
    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, 'members'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const membersArray: AppUser[] = Object.values(data);
        localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(membersArray));
        return membersArray;
      }
    } catch (err) {
      console.warn('Firebase members fetch notice:', err);
    }

    const localCached = localStorage.getItem(STORAGE_KEY_MEMBERS);
    if (localCached) {
      try {
        return JSON.parse(localCached);
      } catch (e) {}
    }

    return [];
  },

  async saveMembers(members: AppUser[]): Promise<{ success: boolean; error?: string }> {
    const cleanMembers = cleanForFirebase(members) || [];
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(cleanMembers));
    let success = false;
    let lastError = '';

    try {
      const membersRef = ref(rtdb, 'members');
      const map: Record<string, AppUser> = {};
      cleanMembers.forEach((m: AppUser) => {
        if (m && m.uid) {
          map[m.uid] = m;
        }
      });
      await set(membersRef, map);
      success = true;
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error('Firebase saveMembers error:', err);
    }

    try {
      for (const m of cleanMembers) {
        if (m && m.uid) {
          await setDoc(doc(db, 'members', m.uid), m, { merge: true });
        }
      }
      success = true;
    } catch (err: any) {
      if (!lastError) lastError = err?.message || String(err);
    }

    return { success, error: success ? undefined : lastError };
  },

  async upsertMember(member: AppUser): Promise<{ success: boolean; error?: string }> {
    const clean = cleanForFirebase(member);
    let success = false;
    let lastError = '';

    try {
      const memberRef = ref(rtdb, `members/${member.uid}`);
      await set(memberRef, clean);
      success = true;
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error('Firebase upsertMember error:', err);
    }

    try {
      await setDoc(doc(db, 'members', member.uid), clean, { merge: true });
      success = true;
    } catch (err: any) {
      if (!lastError) lastError = err?.message || String(err);
    }

    return { success, error: success ? undefined : lastError };
  },

  async deleteMember(uid: string): Promise<void> {
    try {
      const memberRef = ref(rtdb, `members/${uid}`);
      await set(memberRef, null);
    } catch (e) {}
  },

  // Playlists Management
  async fetchPlaylists(): Promise<Playlist[]> {
    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, 'playlists'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Playlist[] = Object.values(data);
        localStorage.setItem('xuanken_music_playlists_v1', JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('Firebase playlists fetch notice:', err);
    }

    const local = localStorage.getItem('xuanken_music_playlists_v1');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
    return [];
  },

  async savePlaylists(playlists: Playlist[]): Promise<{ success: boolean; error?: string }> {
    const clean = cleanForFirebase(playlists) || [];
    localStorage.setItem('xuanken_music_playlists_v1', JSON.stringify(clean));
    let success = false;
    let lastError = '';

    try {
      const pRef = ref(rtdb, 'playlists');
      const map: Record<string, Playlist> = {};
      clean.forEach((p: Playlist) => {
        if (p && p.id) {
          map[p.id] = p;
        }
      });
      await set(pRef, map);
      success = true;
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error('Firebase savePlaylists error:', err);
    }

    return { success, error: success ? undefined : lastError };
  },

  async upsertPlaylist(playlist: Playlist): Promise<{ success: boolean; error?: string }> {
    const clean = cleanForFirebase(playlist);
    let success = false;
    let lastError = '';

    try {
      const pRef = ref(rtdb, `playlists/${clean.id}`);
      await set(pRef, clean);
      success = true;
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error('Firebase upsertPlaylist error:', err);
    }

    try {
      const local = localStorage.getItem('xuanken_music_playlists_v1');
      const list: Playlist[] = local ? JSON.parse(local) : [];
      const idx = list.findIndex((p) => p.id === clean.id);
      if (idx >= 0) list[idx] = clean;
      else list.unshift(clean);
      localStorage.setItem('xuanken_music_playlists_v1', JSON.stringify(list));
    } catch (e) {}

    return { success, error: success ? undefined : lastError };
  },

  async deletePlaylist(id: string): Promise<void> {
    try {
      const pRef = ref(rtdb, `playlists/${id}`);
      await set(pRef, null);
    } catch (e) {}
    try {
      const local = localStorage.getItem('xuanken_music_playlists_v1');
      if (local) {
        const list: Playlist[] = JSON.parse(local);
        localStorage.setItem('xuanken_music_playlists_v1', JSON.stringify(list.filter((p) => p.id !== id)));
      }
    } catch (e) {}
  },

  // Vouchers / Coupons Management
  async fetchVouchers(): Promise<Voucher[]> {
    const defaultVouchers: Voucher[] = [
      {
        id: 'v-xuanken50',
        code: 'XUANKEN50',
        discountType: 'percent',
        discountValue: 50,
        description: 'Giảm giá 50% tất cả bài hát bản quyền',
        isActive: true,
      },
      {
        id: 'v-vip2026',
        code: 'VIP2026',
        discountType: 'fixed',
        discountValue: 30000,
        description: 'Giảm ngay 30.000đ khi mua nhạc',
        isActive: true,
      },
      {
        id: 'v-promo20',
        code: 'PROMO20',
        discountType: 'percent',
        discountValue: 20,
        description: 'Ưu đãi 20% cho thành viên mới',
        isActive: true,
      },
    ];

    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, 'vouchers'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Voucher[] = Object.values(data);
        localStorage.setItem('xuanken_music_vouchers_v1', JSON.stringify(list));
        return list;
      }
    } catch (err) {
      console.warn('Firebase vouchers fetch notice:', err);
    }

    const local = localStorage.getItem('xuanken_music_vouchers_v1');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }

    localStorage.setItem('xuanken_music_vouchers_v1', JSON.stringify(defaultVouchers));
    return defaultVouchers;
  },

  async saveVouchers(vouchers: Voucher[]): Promise<{ success: boolean; error?: string }> {
    const clean = cleanForFirebase(vouchers) || [];
    localStorage.setItem('xuanken_music_vouchers_v1', JSON.stringify(clean));
    let success = false;
    let lastError = '';

    try {
      const vRef = ref(rtdb, 'vouchers');
      const map: Record<string, Voucher> = {};
      clean.forEach((v: Voucher) => {
        if (v && v.id) {
          map[v.id] = v;
        }
      });
      await set(vRef, map);
      success = true;
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error('Firebase saveVouchers error:', err);
    }

    return { success, error: success ? undefined : lastError };
  },

  async upsertVoucher(voucher: Voucher): Promise<{ success: boolean; error?: string }> {
    const clean = cleanForFirebase(voucher);
    let success = false;
    let lastError = '';

    try {
      const vRef = ref(rtdb, `vouchers/${clean.id}`);
      await set(vRef, clean);
      success = true;
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error('Firebase upsertVoucher error:', err);
    }

    try {
      const local = localStorage.getItem('xuanken_music_vouchers_v1');
      const list: Voucher[] = local ? JSON.parse(local) : [];
      const idx = list.findIndex((v) => v.id === clean.id);
      if (idx >= 0) list[idx] = clean;
      else list.push(clean);
      localStorage.setItem('xuanken_music_vouchers_v1', JSON.stringify(list));
    } catch (e) {}

    return { success, error: success ? undefined : lastError };
  },

  async deleteVoucher(voucherId: string): Promise<void> {
    try {
      const vRef = ref(rtdb, `vouchers/${voucherId}`);
      await set(vRef, null);
    } catch (e) {}
    try {
      const local = localStorage.getItem('xuanken_music_vouchers_v1');
      if (local) {
        const list: Voucher[] = JSON.parse(local);
        localStorage.setItem('xuanken_music_vouchers_v1', JSON.stringify(list.filter((v) => v.id !== voucherId)));
      }
    } catch (e) {}
  },

  // 1-Click Sync All: Pushes all songs, members, playlists, and vouchers to Firebase
  async syncAllToFirebase(
    songs: Song[],
    members: AppUser[],
    playlists: Playlist[],
    vouchers: Voucher[]
  ): Promise<{
    success: boolean;
    rtdb: boolean;
    firestore: boolean;
    error?: string;
    details: string;
  }> {
    let rtdbSuccess = false;
    let firestoreSuccess = false;
    let lastError = '';

    // 1. Prepare clean data map
    const cleanSongs = cleanForFirebase(songs) || [];
    const cleanMembers = cleanForFirebase(members) || [];
    const cleanPlaylists = cleanForFirebase(playlists) || [];
    const cleanVouchers = cleanForFirebase(vouchers) || [];

    const songsMap: Record<string, any> = {};
    cleanSongs.forEach((s: Song) => { if (s?.id) songsMap[s.id] = s; });

    const membersMap: Record<string, any> = {};
    cleanMembers.forEach((m: AppUser) => { if (m?.uid) membersMap[m.uid] = m; });

    const playlistsMap: Record<string, any> = {};
    cleanPlaylists.forEach((p: Playlist) => { if (p?.id) playlistsMap[p.id] = p; });

    const vouchersMap: Record<string, any> = {};
    cleanVouchers.forEach((v: Voucher) => { if (v?.id) vouchersMap[v.id] = v; });

    // 2. Write to Firebase Realtime Database
    try {
      await update(ref(rtdb), {
        songs: songsMap,
        members: membersMap,
        playlists: playlistsMap,
        vouchers: vouchersMap,
        lastSyncedAt: new Date().toISOString(),
      });
      rtdbSuccess = true;
    } catch (err: any) {
      lastError = err?.message || String(err);
      console.error('Firebase RTDB syncAll error:', err);
    }

    // 3. Write to Cloud Firestore
    try {
      for (const s of cleanSongs) {
        if (s?.id) await setDoc(doc(db, 'songs', s.id), s, { merge: true });
      }
      for (const m of cleanMembers) {
        if (m?.uid) await setDoc(doc(db, 'members', m.uid), m, { merge: true });
      }
      for (const v of cleanVouchers) {
        if (v?.id) await setDoc(doc(db, 'vouchers', v.id), v, { merge: true });
      }
      firestoreSuccess = true;
    } catch (err: any) {
      if (!lastError) lastError = err?.message || String(err);
      console.error('Firestore syncAll error:', err);
    }

    const overallSuccess = rtdbSuccess || firestoreSuccess;
    return {
      success: overallSuccess,
      rtdb: rtdbSuccess,
      firestore: firestoreSuccess,
      error: overallSuccess ? undefined : lastError,
      details: overallSuccess
        ? `Đã đồng bộ ${cleanSongs.length} bài hát, ${cleanMembers.length} thành viên, ${cleanPlaylists.length} playlists, ${cleanVouchers.length} vouchers lên Firebase!`
        : `Lỗi đồng bộ: ${lastError}`,
    };
  },

  // Audio Download Helper for Copyrighted Songs
  async downloadSongAudio(song: Song, format: 'MP3' | 'WAV' = 'MP3'): Promise<{ success: boolean; message: string }> {
    const targetUrl = format === 'WAV' ? (song.wavUrl || song.mp3Url || song.demoUrl) : (song.mp3Url || song.wavUrl || song.demoUrl);
    if (!targetUrl || !targetUrl.trim()) {
      return { success: false, message: 'Bài hát này chưa có link tải chất lượng cao.' };
    }

    const cleanTitle = song.title.replace(/[\\/:*?"<>|]/g, '');
    const cleanArtist = song.artists.replace(/[\\/:*?"<>|]/g, '');
    const ext = format === 'WAV' && song.wavUrl ? 'wav' : 'mp3';
    const fileName = `[XuanKen Music] ${cleanTitle} - ${cleanArtist}.${ext}`;

    try {
      const response = await fetch(targetUrl);
      if (response.ok) {
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
        return { success: true, message: `Bắt đầu tải bài hát: ${fileName}` };
      }
    } catch (e) {
      // Direct anchor click fallback if CORS prevents fetch
    }

    const a = document.createElement('a');
    a.href = targetUrl;
    a.download = fileName;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { success: true, message: `Bắt đầu tải bài hát: ${fileName}` };
  },

  // Weekly Top Plays sync
  async fetchWeeklyPlays(weekKey: string): Promise<Record<string, number>> {
    try {
      const snap = await get(ref(rtdb, `weekly_plays/${weekKey}`));
      if (snap.exists()) {
        return snap.val() || {};
      }
    } catch (e) {
      console.warn('Weekly plays fetch notice:', e);
    }
    try {
      const local = localStorage.getItem(`xuanken_weekly_${weekKey}`);
      if (local) return JSON.parse(local);
    } catch (e) {}
    return {};
  },

  async saveWeeklyPlays(weekKey: string, songPlays: Record<string, number>): Promise<void> {
    const cleanPlays = cleanForFirebase(songPlays) || {};
    try {
      localStorage.setItem(`xuanken_weekly_${weekKey}`, JSON.stringify(cleanPlays));
      await set(ref(rtdb, `weekly_plays/${weekKey}`), cleanPlays);
    } catch (e) {
      console.warn('Weekly plays save notice:', e);
    }
  },

  // User Settings sync (theme, crossfade, format, liked, blocked)
  async saveUserSettings(uid: string, settings: any): Promise<void> {
    const clean = cleanForFirebase(settings);
    try {
      await update(ref(rtdb, `members/${uid}`), clean);
      await setDoc(doc(db, 'members', uid), clean, { merge: true });
    } catch (e) {
      console.warn('User settings save notice:', e);
    }
  },

  // Save report error issue
  async saveSongReport(songId: string, issue: string, userEmail: string): Promise<void> {
    try {
      const reportRef = ref(rtdb, `song_reports/${songId}_${Date.now()}`);
      await set(reportRef, {
        songId,
        issue,
        userEmail,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Save song report notice:', e);
    }
  },

  // Site Settings (Requirement 11)
  async fetchSiteSettings(): Promise<SiteSettings | null> {
    try {
      const snapshot = await get(ref(rtdb, 'site_settings'));
      if (snapshot.exists()) {
        return snapshot.val();
      }
    } catch (e) {
      console.warn('Site settings fetch notice:', e);
    }
    try {
      const saved = localStorage.getItem('xuanken_site_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  },

  async saveSiteSettings(settings: SiteSettings): Promise<void> {
    const clean = cleanForFirebase(settings);
    try {
      localStorage.setItem('xuanken_site_settings', JSON.stringify(clean));
      await set(ref(rtdb, 'site_settings'), clean);
    } catch (e) {
      console.warn('Site settings save notice:', e);
    }
  },
};


