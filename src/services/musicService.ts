import { ref, set, get, child, update, onValue } from 'firebase/database';
import { doc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { rtdb, db, auth } from './firebase';
import { Song, AppUser, Playlist, Voucher, SiteSettings, ExclusiveAlbum, AlbumSong, ChatMessage } from '../types/music';
import { SONGS_DATABASE } from '../data/songs';

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
    likesCount: typeof raw?.likesCount === 'number' ? raw.likesCount : (raw?.likesCount ? Number(raw.likesCount) : 0),
    releaseDate: raw?.releaseDate || '2026',
    composer: raw?.composer || raw?.artists || 'XuanKen',
    genre: raw?.genre || 'Việt Nam, V-Pop',
    provider: raw?.provider || 'XuanKen Official',
    plays: raw?.plays || '0 lượt nghe',
  };
}

export function sanitizeAlbum(raw: any, idFallback: string): ExclusiveAlbum {
  let songsList: any[] = [];
  if (Array.isArray(raw?.songs)) {
    songsList = raw.songs.filter(Boolean);
  } else if (raw?.songs && typeof raw.songs === 'object' && raw?.songs !== null) {
    songsList = Object.values(raw.songs).filter(Boolean);
  }

  const albumId = raw?.id || idFallback;
  const albumArtist = raw?.artist || 'XuanKen Official';
  const albumCover = raw?.coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

  const sanitizedSongs: AlbumSong[] = songsList.map((s: any, idx: number) => ({
    id: s?.id || `albsong-${albumId}-${idx + 1}`,
    albumId: s?.albumId || albumId,
    stt: typeof s?.stt === 'number' ? s.stt : idx + 1,
    title: s?.title || `Bài hát ${idx + 1}`,
    artists: s?.artists || albumArtist,
    duration: typeof s?.duration === 'number' && s.duration > 0 ? s.duration : 210,
    audioFormat: s?.audioFormat === 'WAV' ? 'WAV' : 'MP3',
    coverImage: s?.coverImage || albumCover,
    mp3Url: s?.mp3Url || '',
    wavUrl: s?.wavUrl || '',
    demoUrl: s?.demoUrl || s?.mp3Url || s?.wavUrl || '',
    lrcRaw: s?.lrcRaw || '',
    lyrics: Array.isArray(s?.lyrics) ? s.lyrics : [],
    playCount: typeof s?.playCount === 'number' ? s.playCount : 0,
    createdAt: s?.createdAt || new Date().toISOString(),
  }));

  sanitizedSongs.forEach((s, idx) => {
    s.stt = idx + 1;
  });

  return {
    id: albumId,
    title: raw?.title || 'Album Mới',
    artist: albumArtist,
    coverImage: albumCover,
    description: raw?.description || '',
    releaseYear: raw?.releaseYear || new Date().getFullYear().toString(),
    genre: raw?.genre || 'V-Pop / Ballad',
    songs: sanitizedSongs,
    createdAt: raw?.createdAt || new Date().toISOString(),
  };
}

export const MusicService = {
  // Subscribe to real-time song updates from Firebase RTDB
  subscribeToSongs(onUpdate: (songs: Song[]) => void): () => void {
    try {
      const songsRef = ref(rtdb, 'songs');
      return onValue(
        songsRef,
        (snapshot: any) => {
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
        (err: any) => {
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
        docsSnap.forEach((d: any) => {
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

    return SONGS_DATABASE;
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
    const applyLocalBalanceOverrides = (arr: AppUser[]): AppUser[] => {
      return arr.map((m) => {
        if (!m || !m.uid) return m;
        try {
          const localBal = localStorage.getItem(`xuanken_member_balance_${m.uid}`);
          if (localBal !== null) {
            const num = parseInt(localBal, 10);
            if (!isNaN(num)) {
              return { ...m, balance: num };
            }
          }
        } catch (e) {}
        return m;
      });
    };

    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, 'members'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        let membersArray: AppUser[] = Object.values(data);
        if (membersArray.length > 0) {
          membersArray = applyLocalBalanceOverrides(membersArray);
          localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(membersArray));
          return membersArray;
        }
      }
    } catch (err: any) {
      const isPermDenied = err?.message?.toLowerCase().includes('permission_denied') || err?.message?.toLowerCase().includes('permission denied');
      if (!isPermDenied) {
        console.warn('Firebase members fetch notice:', err);
      }
    }

    // Attempt Firestore fallback for members
    try {
      const colRef = collection(db, 'members');
      const docsSnap = await getDocs(colRef);
      if (!docsSnap.empty) {
        let membersArray: AppUser[] = [];
        docsSnap.forEach((d: any) => {
          const val = d.data();
          if (val && val.email) {
            membersArray.push({
              uid: val.uid || d.id,
              email: val.email,
              displayName: val.displayName || val.email.split('@')[0],
              avatarUrl: val.avatarUrl || '',
              balance: typeof val.balance === 'number' ? val.balance : 500000,
              purchasedSongIds: Array.isArray(val.purchasedSongIds) ? val.purchasedSongIds : [],
              blockedSongIds: Array.isArray(val.blockedSongIds) ? val.blockedSongIds : [],
              role: val.role || 'user',
              createdAt: val.createdAt || new Date().toLocaleDateString('vi-VN'),
            });
          }
        });
        if (membersArray.length > 0) {
          membersArray = applyLocalBalanceOverrides(membersArray);
          localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(membersArray));
          return membersArray;
        }
      }
    } catch (err) {
      console.warn('Firestore fallback fetchMembers notice:', err);
    }

    const localCached = localStorage.getItem(STORAGE_KEY_MEMBERS);
    if (localCached) {
      try {
        const parsed = JSON.parse(localCached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return applyLocalBalanceOverrides(parsed);
        }
      } catch (e) {}
    }

    // Default member if authenticated
    if (auth.currentUser) {
      const isPrimaryAdmin = auth.currentUser.email?.toLowerCase().trim() === 'admin@xuanken.vn' ||
                             auth.currentUser.email?.toLowerCase().trim() === 'phamthikimthanh.qy@gmail.com';
      let bal = 500000;
      try {
        const stored = localStorage.getItem(`xuanken_member_balance_${auth.currentUser.uid}`);
        if (stored !== null) bal = parseInt(stored, 10) || 500000;
      } catch (e) {}
      const fallbackMember: AppUser = {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email || (isPrimaryAdmin ? 'admin@xuanken.vn' : 'user@xuanken.vn'),
        displayName: auth.currentUser.displayName || (isPrimaryAdmin ? 'Admin XuanKen' : 'Thành Viên'),
        balance: bal,
        purchasedSongIds: [],
        blockedSongIds: [],
        role: isPrimaryAdmin ? 'admin' : 'user',
        createdAt: new Date().toLocaleDateString('vi-VN'),
      };
      return [fallbackMember];
    }

    return [];
  },

  async saveMembers(members: AppUser[]): Promise<{ success: boolean; error?: string }> {
    const cleanMembers = cleanForFirebase(members) || [];
    // Ensure every member balance is individually preserved in local storage
    cleanMembers.forEach((m: AppUser) => {
      if (m && m.uid && typeof m.balance === 'number') {
        try {
          localStorage.setItem(`xuanken_member_balance_${m.uid}`, m.balance.toString());
        } catch (e) {}
      }
    });
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(cleanMembers));
    let success = false;
    let lastError = '';

    // Save each member individually to RTDB first (matches child rule)
    for (const m of cleanMembers) {
      if (m && m.uid) {
        try {
          await set(ref(rtdb, `members/${m.uid}`), m);
          success = true;
        } catch (e) {}
      }
    }

    // Also attempt bulk save to members node
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
    }

    // Save to Cloud Firestore
    try {
      for (const m of cleanMembers) {
        if (m && m.uid) {
          await setDoc(doc(db, 'members', m.uid), m, { merge: true });
          const isUserAdmin = m.role === 'admin' ||
            (m.email && (m.email.toLowerCase().trim() === 'admin@xuanken.vn' || m.email.toLowerCase().trim() === 'phamthikimthanh.qy@gmail.com'));
          if (isUserAdmin) {
            try {
              await set(ref(rtdb, `admins/${m.uid}`), { email: m.email, role: 'admin', setAt: new Date().toISOString() });
              await setDoc(doc(db, 'admins', m.uid), { email: m.email, role: 'admin', setAt: new Date().toISOString() }, { merge: true });
            } catch (e) {}
          } else if (m.email && m.email.toLowerCase().trim() !== 'admin@xuanken.vn' && m.email.toLowerCase().trim() !== 'phamthikimthanh.qy@gmail.com') {
            try {
              await set(ref(rtdb, `admins/${m.uid}`), null);
              await deleteDoc(doc(db, 'admins', m.uid));
            } catch (e) {}
          }
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
    if (clean && clean.uid && typeof clean.balance === 'number') {
      try {
        localStorage.setItem(`xuanken_member_balance_${clean.uid}`, clean.balance.toString());
      } catch (e) {}
    }

    // Keep cached members list up to date
    try {
      const cached = localStorage.getItem(STORAGE_KEY_MEMBERS);
      const list: AppUser[] = cached ? JSON.parse(cached) : [];
      const idx = list.findIndex((m) => m.uid === member.uid);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...clean };
      } else {
        list.push(clean);
      }
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(list));
    } catch (e) {}

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
      const isUserAdmin = member.role === 'admin' ||
        (member.email && (member.email.toLowerCase().trim() === 'admin@xuanken.vn' || member.email.toLowerCase().trim() === 'phamthikimthanh.qy@gmail.com'));
      if (isUserAdmin) {
        try {
          await set(ref(rtdb, `admins/${member.uid}`), { email: member.email, role: 'admin', setAt: new Date().toISOString() });
          await setDoc(doc(db, 'admins', member.uid), { email: member.email, role: 'admin', setAt: new Date().toISOString() }, { merge: true });
        } catch (e) {}
      } else if (member.email && member.email.toLowerCase().trim() !== 'admin@xuanken.vn' && member.email.toLowerCase().trim() !== 'phamthikimthanh.qy@gmail.com') {
        try {
          await set(ref(rtdb, `admins/${member.uid}`), null);
          await deleteDoc(doc(db, 'admins', member.uid));
        } catch (e) {}
      }
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
      await set(ref(rtdb, `admins/${uid}`), null);
    } catch (e) {}
    try {
      await deleteDoc(doc(db, 'members', uid));
      await deleteDoc(doc(db, 'admins', uid));
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

  // Record an immutable purchase transaction
  async recordPurchase(purchase: any): Promise<boolean> {
    const clean = cleanForFirebase(purchase);
    try {
      await set(ref(rtdb, `purchases/${purchase.id}`), clean);
    } catch (e) {
      console.warn('RTDB recordPurchase notice:', e);
    }
    try {
      await setDoc(doc(db, 'purchases', purchase.id), clean, { merge: true });
    } catch (e) {
      console.warn('Firestore recordPurchase notice:', e);
    }
    return true;
  },

  // 1-Click Sync All: Pushes all songs, members, playlists, and vouchers to Firebase
  async syncAllToFirebase(
    songs: Song[],
    members: AppUser[],
    playlists: Playlist[],
    vouchers: Voucher[],
    exclusiveAlbums?: ExclusiveAlbum[]
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
    const cleanAlbums = (exclusiveAlbums || []).map((a, i) => sanitizeAlbum(a, a.id || `alb-${i}`));

    const songsMap: Record<string, any> = {};
    cleanSongs.forEach((s: Song) => { if (s?.id) songsMap[s.id] = s; });

    const membersMap: Record<string, any> = {};
    cleanMembers.forEach((m: AppUser) => { if (m?.uid) membersMap[m.uid] = m; });

    const playlistsMap: Record<string, any> = {};
    cleanPlaylists.forEach((p: Playlist) => { if (p?.id) playlistsMap[p.id] = p; });

    const vouchersMap: Record<string, any> = {};
    cleanVouchers.forEach((v: Voucher) => { if (v?.id) vouchersMap[v.id] = v; });

    const albumsMap: Record<string, any> = {};
    cleanAlbums.forEach((a: ExclusiveAlbum) => { if (a?.id) albumsMap[a.id] = cleanForFirebase(a); });

    // 2. Write to Firebase Realtime Database
    try {
      const payload: Record<string, any> = {
        songs: songsMap,
        members: membersMap,
        playlists: playlistsMap,
        vouchers: vouchersMap,
        lastSyncedAt: new Date().toISOString(),
      };
      if (cleanAlbums.length > 0) {
        payload.exclusive_albums = albumsMap;
      }
      await update(ref(rtdb), payload);
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
      if (cleanAlbums.length > 0) {
        for (const a of cleanAlbums) {
          if (a?.id) await setDoc(doc(db, 'exclusive_albums', a.id), cleanForFirebase(a), { merge: true });
        }
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
        ? `Đã đồng bộ ${cleanSongs.length} bài hát, ${cleanAlbums.length} album, ${cleanMembers.length} thành viên, ${cleanPlaylists.length} playlists, ${cleanVouchers.length} vouchers lên Firebase!`
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



  // -------------------------------------------------------------
  // Audio Format Settings (MP3 / WAV) Sync (Requirement 5)
  // -------------------------------------------------------------
  async fetchAudioSettings(uid?: string): Promise<{ preferredFormat: 'MP3' | 'WAV'; formatMap: Record<string, 'MP3' | 'WAV'> } | null> {
    if (!uid) {
      try {
        const localPref = localStorage.getItem('xuanken_preferred_audio_format') as 'MP3' | 'WAV';
        const localMap = localStorage.getItem('xuanken_song_format_map');
        return {
          preferredFormat: localPref === 'WAV' ? 'WAV' : 'MP3',
          formatMap: localMap ? JSON.parse(localMap) : {},
        };
      } catch (e) {
        return null;
      }
    }
    const key = `users/${uid}/audio_settings`;
    try {
      const snapshot = await get(ref(rtdb, key));
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val) {
          if (val.preferredFormat) {
            localStorage.setItem('xuanken_preferred_audio_format', val.preferredFormat);
          }
          if (val.formatMap) {
            localStorage.setItem('xuanken_song_format_map', JSON.stringify(val.formatMap));
          }
          return {
            preferredFormat: val.preferredFormat === 'WAV' ? 'WAV' : 'MP3',
            formatMap: val.formatMap || {},
          };
        }
      }
    } catch (e: any) {
      const isPermDenied = e?.message?.toLowerCase().includes('permission_denied') || e?.message?.toLowerCase().includes('permission denied');
      if (!isPermDenied) {
        console.warn('Audio settings fetch notice:', e);
      }
    }
    try {
      const localPref = localStorage.getItem('xuanken_preferred_audio_format') as 'MP3' | 'WAV';
      const localMap = localStorage.getItem('xuanken_song_format_map');
      return {
        preferredFormat: localPref === 'WAV' ? 'WAV' : 'MP3',
        formatMap: localMap ? JSON.parse(localMap) : {},
      };
    } catch (e) {
      return null;
    }
  },

  async saveAudioSettings(preferredFormat: 'MP3' | 'WAV', formatMap: Record<string, 'MP3' | 'WAV'>, uid?: string): Promise<void> {
    const payload = {
      preferredFormat,
      formatMap: cleanForFirebase(formatMap) || {},
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('xuanken_preferred_audio_format', preferredFormat);
      localStorage.setItem('xuanken_song_format_map', JSON.stringify(payload.formatMap));
    } catch (e) {}
    try {
      const key = uid ? `users/${uid}/audio_settings` : 'audio_settings/shared';
      await set(ref(rtdb, key), payload);
      if (uid) {
        await update(ref(rtdb, `members/${uid}`), { preferredAudioFormat: preferredFormat });
      }
    } catch (e) {
      console.warn('Audio settings save notice:', e);
    }
  },

  // -------------------------------------------------------------
  // Curated / Exclusive Albums (Album Nhạc Hay)
  // Strict Isolation: Album songs ONLY live inside their albums
  // -------------------------------------------------------------
  async fetchExclusiveAlbums(): Promise<ExclusiveAlbum[]> {
    const hasInitialized = localStorage.getItem('xuanken_exclusive_albums_init') === 'true';

    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, 'exclusive_albums'));
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val && (val._empty === true || val === 'EMPTY')) {
          localStorage.setItem('xuanken_exclusive_albums_v1', JSON.stringify([]));
          localStorage.setItem('xuanken_exclusive_albums_init', 'true');
          return [];
        }
        let rawList: any[] = [];
        if (Array.isArray(val)) {
          rawList = val.filter(Boolean);
        } else if (typeof val === 'object' && val !== null) {
          rawList = Object.values(val).filter((item: any) => item && typeof item === 'object' && item.title);
        }
        const albums = rawList.map((a: any, idx: number) => sanitizeAlbum(a, a?.id || `alb-${idx}`));
        localStorage.setItem('xuanken_exclusive_albums_v1', JSON.stringify(albums));
        localStorage.setItem('xuanken_exclusive_albums_init', 'true');
        return albums;
      }
    } catch (e: any) {
      const isPerm = e?.message?.toLowerCase().includes('permission_denied') || e?.message?.toLowerCase().includes('permission denied');
      if (!isPerm) console.warn('Fetch exclusive albums RTDB notice:', e);
    }

    // Try Firestore fallback
    try {
      const colRef = collection(db, 'exclusive_albums');
      const docsSnap = await getDocs(colRef);
      if (!docsSnap.empty) {
        const albums: ExclusiveAlbum[] = [];
        docsSnap.forEach((d: any) => {
          const val = d.data();
          if (val && val.title) {
            albums.push(sanitizeAlbum(val, d.id));
          }
        });
        localStorage.setItem('xuanken_exclusive_albums_v1', JSON.stringify(albums));
        localStorage.setItem('xuanken_exclusive_albums_init', 'true');
        return albums;
      }
    } catch (e: any) {
      // ignore
    }

    // Check localStorage
    try {
      const local = localStorage.getItem('xuanken_exclusive_albums_v1');
      if (local !== null) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          if (parsed.length > 0 || hasInitialized) {
            return parsed.map((a: any, idx: number) => sanitizeAlbum(a, a?.id || `alb-${idx}`));
          }
        }
      }
    } catch (e) {}

    // Only fallback to default curated albums on brand new first-time setup
    if (!hasInitialized) {
      const defaults = DEFAULT_EXCLUSIVE_ALBUMS.map((a, idx) => sanitizeAlbum(a, a.id || `alb-${idx}`));
      localStorage.setItem('xuanken_exclusive_albums_v1', JSON.stringify(defaults));
      return defaults;
    }

    return [];
  },

  async saveExclusiveAlbums(albums: ExclusiveAlbum[]): Promise<{
    success: boolean;
    rtdb: boolean;
    firestore: boolean;
    error?: string;
  }> {
    const cleanAlbums = (albums || []).map((a, i) => sanitizeAlbum(a, a.id || `alb-${i}`));
    try {
      localStorage.setItem('xuanken_exclusive_albums_v1', JSON.stringify(cleanAlbums));
      localStorage.setItem('xuanken_exclusive_albums_init', 'true');
    } catch (e) {}

    let rtdbSuccess = false;
    let firestoreSuccess = false;
    let lastError = '';

    // Convert list to map by ID for Realtime Database
    const albumsMap: Record<string, any> = {};
    if (cleanAlbums.length === 0) {
      albumsMap._empty = true;
      albumsMap.updatedAt = new Date().toISOString();
    } else {
      cleanAlbums.forEach((a) => {
        if (a?.id) {
          albumsMap[a.id] = cleanForFirebase(a);
        }
      });
    }

    try {
      await set(ref(rtdb, 'exclusive_albums'), albumsMap);
      rtdbSuccess = true;
    } catch (e: any) {
      lastError = e?.message || String(e);
      console.warn('Save exclusive albums RTDB notice:', e);
    }

    try {
      // Keep Firestore in sync by removing deleted albums
      const colRef = collection(db, 'exclusive_albums');
      const docsSnap = await getDocs(colRef);
      const remainingIds = new Set(cleanAlbums.map((a) => a.id));
      for (const d of docsSnap.docs) {
        if (!remainingIds.has(d.id)) {
          await deleteDoc(doc(db, 'exclusive_albums', d.id));
        }
      }
      for (const a of cleanAlbums) {
        if (a?.id) {
          await setDoc(doc(db, 'exclusive_albums', a.id), cleanForFirebase(a), { merge: true });
        }
      }
      await setDoc(doc(db, 'system', 'exclusive_albums'), { albums: cleanForFirebase(cleanAlbums), updatedAt: new Date().toISOString() }, { merge: true });
      firestoreSuccess = true;
    } catch (e: any) {
      if (!lastError) lastError = e?.message || String(e);
      console.warn('Save exclusive albums Firestore notice:', e);
    }

    const overallSuccess = rtdbSuccess || firestoreSuccess;
    return {
      success: overallSuccess,
      rtdb: rtdbSuccess,
      firestore: firestoreSuccess,
      error: overallSuccess ? undefined : lastError,
    };
  },

  async deleteExclusiveAlbum(albumId: string): Promise<void> {
    try {
      await set(ref(rtdb, `exclusive_albums/${albumId}`), null);
    } catch (e) {}
    try {
      await deleteDoc(doc(db, 'exclusive_albums', albumId));
    } catch (e) {}
    try {
      const local = localStorage.getItem('xuanken_exclusive_albums_v1');
      if (local) {
        const parsed: ExclusiveAlbum[] = JSON.parse(local);
        const filtered = parsed.filter((a) => a.id !== albumId);
        localStorage.setItem('xuanken_exclusive_albums_v1', JSON.stringify(filtered));
        localStorage.setItem('xuanken_exclusive_albums_init', 'true');
      }
    } catch (e) {}
  },

  async seedDefaultAlbums(): Promise<{ success: boolean; error?: string }> {
    const defaults = DEFAULT_EXCLUSIVE_ALBUMS.map((a, idx) => sanitizeAlbum(a, a.id || `alb-${idx}`));
    localStorage.setItem('xuanken_exclusive_albums_init', 'true');
    return await this.saveExclusiveAlbums(defaults);
  },

  subscribeToExclusiveAlbums(onUpdate: (albums: ExclusiveAlbum[]) => void): () => void {
    try {
      const albumsRef = ref(rtdb, 'exclusive_albums');
      return onValue(
        albumsRef,
        (snapshot: any) => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            if (val && (val._empty === true || val === 'EMPTY')) {
              localStorage.setItem('xuanken_exclusive_albums_v1', JSON.stringify([]));
              localStorage.setItem('xuanken_exclusive_albums_init', 'true');
              onUpdate([]);
              return;
            }
            let rawList: any[] = [];
            if (Array.isArray(val)) {
              rawList = val.filter(Boolean);
            } else if (typeof val === 'object' && val !== null) {
              rawList = Object.values(val).filter((item: any) => item && typeof item === 'object' && item.title);
            }
            const albums = rawList.map((a: any, idx: number) => sanitizeAlbum(a, a?.id || `alb-${idx}`));
            localStorage.setItem('xuanken_exclusive_albums_v1', JSON.stringify(albums));
            localStorage.setItem('xuanken_exclusive_albums_init', 'true');
            onUpdate(albums);
          }
        },
        (err: any) => {
          const isPerm = err?.message?.toLowerCase().includes('permission_denied') || err?.message?.toLowerCase().includes('permission denied');
          if (!isPerm) console.warn('Exclusive albums RTDB listener notice:', err);
        }
      );
    } catch (e) {
      return () => {};
    }
  },

  // -------------------------------------------------------------
  // Community Chat Box
  // -------------------------------------------------------------
  async fetchChatMessages(): Promise<ChatMessage[]> {
    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, 'chat_messages'));
      if (snapshot.exists()) {
        const val = snapshot.val();
        let list: ChatMessage[] = [];
        if (Array.isArray(val)) {
          list = val.filter(Boolean);
        } else if (typeof val === 'object') {
          list = Object.values(val);
        }
        if (list.length > 0) {
          list.sort((a, b) => a.timestamp - b.timestamp);
          localStorage.setItem('xuanken_chat_messages_v1', JSON.stringify(list));
          return list;
        }
      }
    } catch (e: any) {
      const isPerm = e?.message?.toLowerCase().includes('permission_denied') || e?.message?.toLowerCase().includes('permission denied');
      if (!isPerm) console.warn('Fetch chat messages notice:', e);
    }

    try {
      const local = localStorage.getItem('xuanken_chat_messages_v1');
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}

    localStorage.setItem('xuanken_chat_messages_v1', JSON.stringify(DEFAULT_CHAT_MESSAGES));
    return DEFAULT_CHAT_MESSAGES;
  },

  async sendChatMessage(msg: Omit<ChatMessage, 'id'>): Promise<ChatMessage> {
    const id = 'chat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    const newMsg: ChatMessage = {
      ...msg,
      id,
      timestamp: msg.timestamp || Date.now(),
    };

    // Update local cache first
    try {
      const current = await this.fetchChatMessages();
      const updated = [...current, newMsg].slice(-100); // keep latest 100 messages
      localStorage.setItem('xuanken_chat_messages_v1', JSON.stringify(updated));
    } catch (e) {}

    // Save to RTDB
    try {
      await set(ref(rtdb, `chat_messages/${id}`), cleanForFirebase(newMsg));
    } catch (e: any) {
      console.warn('Send chat message RTDB notice:', e);
    }

    return newMsg;
  },

  async deleteChatMessage(id: string): Promise<void> {
    try {
      const current = await this.fetchChatMessages();
      const filtered = current.filter((m) => m.id !== id);
      localStorage.setItem('xuanken_chat_messages_v1', JSON.stringify(filtered));
    } catch (e) {}

    try {
      await set(ref(rtdb, `chat_messages/${id}`), null);
    } catch (e) {}
  },

  async togglePinChatMessage(id: string, isPinned: boolean): Promise<void> {
    try {
      const current = await this.fetchChatMessages();
      const updated = current.map((m) => (m.id === id ? { ...m, isPinned } : m));
      localStorage.setItem('xuanken_chat_messages_v1', JSON.stringify(updated));
    } catch (e) {}

    try {
      await update(ref(rtdb, `chat_messages/${id}`), { isPinned });
    } catch (e) {}
  },

  async editChatMessage(id: string, newContent: string): Promise<void> {
    try {
      const current = await this.fetchChatMessages();
      const updated = current.map((m) => (m.id === id ? { ...m, content: newContent, isEdited: true } : m));
      localStorage.setItem('xuanken_chat_messages_v1', JSON.stringify(updated));
    } catch (e) {}

    try {
      await update(ref(rtdb, `chat_messages/${id}`), { content: newContent, isEdited: true });
    } catch (e) {}
  },

  async fetchBannedUsers(): Promise<Record<string, { bannedUntil: number | null; bannedAt: number; userName: string }>> {
    try {
      const snapshot = await get(ref(rtdb, 'banned_chat_members'));
      if (snapshot.exists()) {
        const val = snapshot.val() || {};
        localStorage.setItem('xuanken_banned_chat_members', JSON.stringify(val));
        return val;
      }
    } catch (e) {}
    try {
      const local = localStorage.getItem('xuanken_banned_chat_members');
      if (local) return JSON.parse(local);
    } catch (e) {}
    return {};
  },

  async banChatMember(userId: string, userName: string, durationMinutes: number | null): Promise<void> {
    const bannedAt = Date.now();
    const bannedUntil = durationMinutes ? bannedAt + durationMinutes * 60 * 1000 : null;
    const data = { bannedUntil, bannedAt, userName };

    try {
      const local = localStorage.getItem('xuanken_banned_chat_members');
      const map = local ? JSON.parse(local) : {};
      map[userId] = data;
      localStorage.setItem('xuanken_banned_chat_members', JSON.stringify(map));
    } catch (e) {}

    try {
      await set(ref(rtdb, `banned_chat_members/${userId}`), data);
    } catch (e) {}
  },

  async unbanChatMember(userId: string): Promise<void> {
    try {
      const local = localStorage.getItem('xuanken_banned_chat_members');
      if (local) {
        const map = JSON.parse(local);
        delete map[userId];
        localStorage.setItem('xuanken_banned_chat_members', JSON.stringify(map));
      }
    } catch (e) {}

    try {
      await set(ref(rtdb, `banned_chat_members/${userId}`), null);
    } catch (e) {}
  },

  subscribeToChatMessages(onUpdate: (messages: ChatMessage[]) => void): () => void {
    try {
      const chatRef = ref(rtdb, 'chat_messages');
      return onValue(
        chatRef,
        (snapshot: any) => {
          if (snapshot.exists()) {
            const val = snapshot.val();
            let list: ChatMessage[] = [];
            if (Array.isArray(val)) {
              list = val.filter(Boolean);
            } else if (typeof val === 'object' && val !== null) {
              list = Object.values(val);
            }
            const seen = new Set<string>();
            const uniqueList: ChatMessage[] = [];
            for (const m of list) {
              if (m && m.id && !seen.has(m.id)) {
                seen.add(m.id);
                uniqueList.push(m);
              }
            }
            uniqueList.sort((a, b) => a.timestamp - b.timestamp);
            localStorage.setItem('xuanken_chat_messages_v1', JSON.stringify(uniqueList));
            onUpdate(uniqueList);
          }
        },
        () => {}
      );
    } catch (e) {
      return () => {};
    }
  },
};

export const DEFAULT_EXCLUSIVE_ALBUMS: ExclusiveAlbum[] = [
  {
    id: 'alb-xk-01',
    title: 'Album Nhạc Trẻ Hay',
    artist: 'XuanKen Official',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    description: 'Tuyển tập những ca khúc nhạc trẻ hay nhất được yêu thích từ XuanKen Music.',
    releaseYear: '2026',
    genre: 'Nhạc Trẻ / V-Pop',
    createdAt: new Date().toISOString(),
    songs: [
      {
        id: 'albsong-01-01',
        albumId: 'alb-xk-01',
        stt: 1,
        title: 'Gió Thoảng Mây Bay',
        artists: 'XuanKen',
        duration: 215,
        audioFormat: 'MP3',
        coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        mp3Url: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo1.mp3',
        wavUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo1.mp3',
        demoUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo1.mp3',
        lrcRaw: '[00:00.00] Gió Thoảng Mây Bay - XuanKen\n[00:15.00] Gió vẫn nhẹ bay qua từng con phố quen...\n[00:30.00] Ký ức ngày xưa ngỡ như vừa mới hôm qua...\n[00:45.00] Còn lại nơi đây nỗi nhớ không tên...',
        lyrics: [
          { time: 0, text: 'Gió Thoảng Mây Bay - XuanKen' },
          { time: 15, text: 'Gió vẫn nhẹ bay qua từng con phố quen...' },
          { time: 30, text: 'Ký ức ngày xưa ngỡ như vừa mới hôm qua...' },
          { time: 45, text: 'Còn lại nơi đây nỗi nhớ không tên...' },
        ],
        playCount: 520,
      },
      {
        id: 'albsong-01-02',
        albumId: 'alb-xk-01',
        stt: 2,
        title: 'Vết Thương Lòng',
        artists: 'XuanKen',
        duration: 250,
        audioFormat: 'WAV',
        coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        mp3Url: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo2.mp3',
        wavUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo2.mp3',
        demoUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo2.mp3',
        lrcRaw: '[00:00.00] Vết Thương Lòng - XuanKen\n[00:18.00] Từng lời hứa năm xưa giờ trôi dạt nơi đâu...\n[00:36.00] Khi cơn mưa kéo đến xua tan giấc mộng đầu...\n[00:54.00] Anh ôm nỗi đau lặng thầm...',
        lyrics: [
          { time: 0, text: 'Vết Thương Lòng - XuanKen' },
          { time: 18, text: 'Từng lời hứa năm xưa giờ trôi dạt nơi đâu...' },
          { time: 36, text: 'Khi cơn mưa kéo đến xua tan giấc mộng đầu...' },
          { time: 54, text: 'Anh ôm nỗi đau lặng thầm...' },
        ],
        playCount: 890,
      },
      {
        id: 'albsong-01-03',
        albumId: 'alb-xk-01',
        stt: 3,
        title: 'Về Với Anh',
        artists: 'XuanKen ft. Mai Anh',
        duration: 230,
        audioFormat: 'MP3',
        coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
        mp3Url: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo1.mp3',
        wavUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo1.mp3',
        demoUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo1.mp3',
        lrcRaw: '[00:00.00] Về Với Anh - XuanKen ft. Mai Anh\n[00:16.00] Hãy về bên anh khi hoàng hôn buông xuống...\n[00:32.00] Ta sẽ cùng nhau đi qua giông bão cuộc đời...',
        lyrics: [
          { time: 0, text: 'Về Với Anh - XuanKen ft. Mai Anh' },
          { time: 16, text: 'Hãy về bên anh khi hoàng hôn buông xuống...' },
          { time: 32, text: 'Ta sẽ cùng nhau đi qua giông bão cuộc đời...' },
        ],
        playCount: 1120,
      },
    ],
  },
  {
    id: 'alb-xk-02',
    title: 'Acoustic Healing V-Pop 2026',
    artist: 'Nhiều Nghệ Sĩ',
    coverImage: 'https://images.unsplash.com/photo-1445985543469-221a5a449231?w=600&auto=format&fit=crop&q=80',
    description: 'Tuyển tập những thanh âm mộc mạc của tiếng đàn guitar gỗ, xoa dịu tâm hồn bạn mỗi đêm muộn.',
    releaseYear: '2026',
    genre: 'Acoustic / Indie',
    createdAt: new Date().toISOString(),
    songs: [
      {
        id: 'albsong-02-01',
        albumId: 'alb-xk-02',
        stt: 1,
        title: 'Chạm Khẽ Tim Anh',
        artists: 'Quốc Bảo (Acoustic Version)',
        duration: 245,
        audioFormat: 'MP3',
        coverImage: 'https://images.unsplash.com/photo-1445985543469-221a5a449231?w=600&auto=format&fit=crop&q=80',
        mp3Url: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo2.mp3',
        wavUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo2.mp3',
        demoUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo2.mp3',
        lrcRaw: '[00:00.00] Chạm Khẽ Tim Anh - Acoustic Version\n[00:15.00] Từng nốt nhạc buông lơi trong chiều vắng...\n[00:30.00] Em có nghe thấy tiếng con tim anh...',
        lyrics: [
          { time: 0, text: 'Chạm Khẽ Tim Anh - Acoustic Version' },
          { time: 15, text: 'Từng nốt nhạc buông lơi trong chiều vắng...' },
          { time: 30, text: 'Em có nghe thấy tiếng con tim anh...' },
        ],
        playCount: 430,
      },
      {
        id: 'albsong-02-02',
        albumId: 'alb-xk-02',
        stt: 2,
        title: 'Đêm Ngắm Sao',
        artists: 'Thanh Trúc Guitar',
        duration: 210,
        audioFormat: 'WAV',
        coverImage: 'https://images.unsplash.com/photo-1445985543469-221a5a449231?w=600&auto=format&fit=crop&q=80',
        mp3Url: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo1.mp3',
        wavUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo1.mp3',
        demoUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo1.mp3',
        lrcRaw: '[00:00.00] Đêm Ngắm Sao - Thanh Trúc Guitar\n[00:20.00] Đêm nay trăng thanh gió mát ngàn trùng...',
        lyrics: [
          { time: 0, text: 'Đêm Ngắm Sao - Thanh Trúc Guitar' },
          { time: 20, text: 'Đêm nay trăng thanh gió mát ngàn trùng...' },
        ],
        playCount: 610,
      },
    ],
  },
  {
    id: 'alb-xk-03',
    title: 'Remix Bass House Nonstop',
    artist: 'XuanKen & DJ Hoàng',
    coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    description: 'Bass đập căng cực, quẩy tung nóc với những bản phối độc quyền chỉ có tại album XuanKen Music.',
    releaseYear: '2026',
    genre: 'Vinahouse / EDM',
    createdAt: new Date().toISOString(),
    songs: [
      {
        id: 'albsong-03-01',
        albumId: 'alb-xk-03',
        stt: 1,
        title: 'Vũ Điệu Ánh Sáng (EDM Mix)',
        artists: 'DJ Hoàng ft. XuanKen',
        duration: 205,
        audioFormat: 'MP3',
        coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
        mp3Url: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo2.mp3',
        wavUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo2.mp3',
        demoUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo2.mp3',
        lrcRaw: '[00:00.00] Vũ Điệu Ánh Sáng (EDM Mix)\n[00:15.00] Put your hands up in the air!\n[00:30.00] 3 2 1 Drop!',
        lyrics: [
          { time: 0, text: 'Vũ Điệu Ánh Sáng (EDM Mix)' },
          { time: 15, text: 'Put your hands up in the air!' },
          { time: 30, text: '3 2 1 Drop!' },
        ],
        playCount: 1540,
      },
    ],
  },
];

export const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'chat-pin-01',
    userId: 'admin-xuanken',
    userName: 'XuanKen Admin',
    userRole: 'admin',
    content: '🎉 Chào mừng các bạn đến với Cộng Đồng Chat XuanKen Music! Cùng lắng nghe những giai điệu tuyệt vời và trò chuyện vui vẻ nhé! ❤️',
    timestamp: Date.now() - 3600000,
    isPinned: true,
  },
  {
    id: 'chat-msg-02',
    userId: 'user-guest-01',
    userName: 'Minh Hoàng',
    userRole: 'user',
    content: 'Album Nhạc Hay mới ra chất lượng đỉnh quá mọi người ơi, nghe bằng tai nghe bass đã tai thật sự 🔥🎶',
    timestamp: Date.now() - 1800000,
  },
];


