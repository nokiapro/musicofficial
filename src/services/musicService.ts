import { ref, set, get, child } from 'firebase/database';
import { rtdb } from './firebase';
import { Song, AppUser } from '../types/music';

const STORAGE_KEY_SONGS = 'xuanken_music_songs_v3';
const STORAGE_KEY_MEMBERS = 'xuanken_music_members_v3';

export const MusicService = {
  // Load songs from Firebase Realtime Database or fallback to LocalStorage
  async fetchSongs(): Promise<Song[]> {
    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, 'songs'));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const songsArray: Song[] = Object.values(data);
        localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(songsArray));
        return songsArray;
      }
    } catch (err) {
      console.warn('Firebase RTDB read notice (falling back to cache):', err);
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
    try {
      const songsRef = ref(rtdb, 'songs');
      const songsMap: Record<string, Song> = {};
      songs.forEach((s) => {
        songsMap[s.id] = s;
      });
      await set(songsRef, songsMap);
      return true;
    } catch (err) {
      console.warn('Firebase sync warning:', err);
      return false;
    }
  },

  // Add or update single song
  async upsertSong(song: Song): Promise<boolean> {
    try {
      const songRef = ref(rtdb, `songs/${song.id}`);
      await set(songRef, song);
    } catch (err) {
      console.warn('Firebase upsert warning:', err);
    }
    return true;
  },

  // Delete song
  async deleteSong(songId: string): Promise<boolean> {
    try {
      const songRef = ref(rtdb, `songs/${songId}`);
      await set(songRef, null);
    } catch (err) {
      console.warn('Firebase delete warning:', err);
    }
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
