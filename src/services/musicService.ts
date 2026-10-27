import { ref, set, get, child, update, onValue } from 'firebase/database';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { rtdb, db } from './firebase';
import { Song, AppUser } from '../types/music';

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
};
