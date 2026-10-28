import { ref, set, get, child, update, onValue } from 'firebase/database';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { rtdb, db } from './firebase';
import { Song, AppUser, Playlist, Voucher } from '../types/music';

const STORAGE_KEY_SONGS = 'xuanken_music_songs_v3';
const STORAGE_KEY_MEMBERS = 'xuanken_music_members_v3';

export const MusicService = {
  // Subscribe to real-time song updates from Firebase RTDB
  subscribeToSongs(onUpdate: (songs: Song[]) => void): () => void {
    try {
      const songsRef = ref(rtdb, 'songs');
      return onValue(
        songsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const songsArray: Song[] = Object.values(data);
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
        const data = snapshot.val();
        const songsArray: Song[] = Object.values(data);
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
          songsArray.push(d.data() as Song);
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
        return JSON.parse(localCached);
      } catch (e) {
        console.error('Failed to parse cached songs:', e);
      }
    }

    return [];
  },

  // Save all songs to Firebase and LocalStorage
  async saveSongsToFirebase(songs: Song[]): Promise<boolean> {
    localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(songs));
    let rtdbSuccess = false;

    // 1. Sync to Firebase Realtime Database
    try {
      const songsRef = ref(rtdb, 'songs');
      const songsMap: Record<string, Song> = {};
      songs.forEach((s) => {
        songsMap[s.id] = s;
      });
      await set(songsRef, songsMap);
      rtdbSuccess = true;
    } catch (err) {
      console.warn('Firebase RTDB saveSongs warning:', err);
    }

    // 2. Also sync to Cloud Firestore
    try {
      for (const song of songs) {
        await setDoc(doc(db, 'songs', song.id), song, { merge: true });
      }
    } catch (err) {
      console.warn('Firebase Firestore saveSongs warning:', err);
    }

    return rtdbSuccess;
  },

  // Add or update single song (with links, coverImage, duration, and playCount)
  async upsertSong(song: Song): Promise<boolean> {
    try {
      const songRef = ref(rtdb, `songs/${song.id}`);
      await set(songRef, song);
    } catch (err) {
      console.warn('Firebase RTDB upsert warning:', err);
    }

    try {
      await setDoc(doc(db, 'songs', song.id), song, { merge: true });
    } catch (err) {
      console.warn('Firestore upsert warning:', err);
    }

    // Update local storage
    try {
      const local = localStorage.getItem(STORAGE_KEY_SONGS);
      const list: Song[] = local ? JSON.parse(local) : [];
      const idx = list.findIndex((s) => s.id === song.id);
      if (idx >= 0) {
        list[idx] = song;
      } else {
        list.unshift(song);
      }
      localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(list));
    } catch (e) {}

    return true;
  },

  // Increment playCount for a song in Firebase and sync live
  async incrementPlayCount(songId: string, newCount: number): Promise<boolean> {
    // 1. Update RTDB
    try {
      const songRef = ref(rtdb, `songs/${songId}`);
      await update(songRef, { playCount: newCount });
    } catch (err) {
      console.warn('Firebase RTDB playCount update warning:', err);
    }

    // 2. Update Firestore
    try {
      await setDoc(doc(db, 'songs', songId), { playCount: newCount }, { merge: true });
    } catch (err) {
      console.warn('Firestore playCount update warning:', err);
    }

    // 3. Update localStorage cache
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

  async saveMembers(members: AppUser[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
    try {
      const membersRef = ref(rtdb, 'members');
      const map: Record<string, AppUser> = {};
      members.forEach((m) => {
        map[m.uid] = m;
      });
      await set(membersRef, map);
    } catch (e) {}
  },

  async upsertMember(member: AppUser): Promise<void> {
    try {
      const memberRef = ref(rtdb, `members/${member.uid}`);
      await set(memberRef, member);
    } catch (e) {}
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

  async savePlaylists(playlists: Playlist[]): Promise<void> {
    const clean = JSON.parse(JSON.stringify(playlists));
    localStorage.setItem('xuanken_music_playlists_v1', JSON.stringify(clean));
    try {
      const pRef = ref(rtdb, 'playlists');
      const map: Record<string, Playlist> = {};
      clean.forEach((p: Playlist) => {
        map[p.id] = p;
      });
      await set(pRef, map);
    } catch (e) {}
  },

  async upsertPlaylist(playlist: Playlist): Promise<void> {
    const clean = JSON.parse(JSON.stringify(playlist));
    try {
      const pRef = ref(rtdb, `playlists/${clean.id}`);
      await set(pRef, clean);
    } catch (e) {}
    // Update local
    try {
      const local = localStorage.getItem('xuanken_music_playlists_v1');
      const list: Playlist[] = local ? JSON.parse(local) : [];
      const idx = list.findIndex((p) => p.id === clean.id);
      if (idx >= 0) list[idx] = clean;
      else list.unshift(clean);
      localStorage.setItem('xuanken_music_playlists_v1', JSON.stringify(list));
    } catch (e) {}
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

    // Initialize with default vouchers
    localStorage.setItem('xuanken_music_vouchers_v1', JSON.stringify(defaultVouchers));
    return defaultVouchers;
  },

  async saveVouchers(vouchers: Voucher[]): Promise<void> {
    const clean = JSON.parse(JSON.stringify(vouchers));
    localStorage.setItem('xuanken_music_vouchers_v1', JSON.stringify(clean));
    try {
      const vRef = ref(rtdb, 'vouchers');
      const map: Record<string, Voucher> = {};
      clean.forEach((v: Voucher) => {
        map[v.id] = v;
      });
      await set(vRef, map);
    } catch (e) {}
  },

  async upsertVoucher(voucher: Voucher): Promise<void> {
    const clean = JSON.parse(JSON.stringify(voucher));
    try {
      const vRef = ref(rtdb, `vouchers/${clean.id}`);
      await set(vRef, clean);
    } catch (e) {}
    try {
      const local = localStorage.getItem('xuanken_music_vouchers_v1');
      const list: Voucher[] = local ? JSON.parse(local) : [];
      const idx = list.findIndex((v) => v.id === clean.id);
      if (idx >= 0) list[idx] = clean;
      else list.push(clean);
      localStorage.setItem('xuanken_music_vouchers_v1', JSON.stringify(list));
    } catch (e) {}
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
      // Try fetching as Blob for clean direct file download
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
};

