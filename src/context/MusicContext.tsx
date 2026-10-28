import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Song, AppUser, ThemeId, RepeatMode, ActiveDesktopTab, ActiveMobileTab, Playlist, Voucher, RewindStats } from '../types/music';
import { auth } from '../services/firebase';
import { audioEngine } from '../services/audioEngine';
import { MusicService } from '../services/musicService';

interface MusicContextType {
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue: Song[];
  history: Song[];
  likedSongIds: string[];
  purchasedSongIds: string[];
  theme: ThemeId;
  activeDesktopTab: ActiveDesktopTab;
  activeMobileTab: ActiveMobileTab;
  isLyricsOpen: boolean;
  isQueueDrawerOpen: boolean;
  isThemeModalOpen: boolean;
  isSleepTimerModalOpen: boolean;
  isMobileFullPlayerOpen: boolean;
  isDemoLimitModalOpen: boolean;
  isBuyModalOpen: boolean;
  isTopUpModalOpen: boolean;
  isLoginModalOpen: boolean;
  songToBuy: Song | null;
  selectedLrcSong: Song | null;
  sleepTimerMinutes: number | null;
  sleepTimerRemainingSeconds: number | null;
  searchQuery: string;
  viewMode: 'auto' | 'pc' | 'mobile';
  effectiveIsMobile: boolean;

  // Auth & Members
  currentUser: AppUser | null;
  isAdmin: boolean;
  isAuthLoading: boolean;
  members: AppUser[];
  userBalance: number;

  playSong: (song: Song, formatOverride?: 'MP3' | 'WAV') => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
  nextSong: () => void;
  prevSong: () => void;
  toggleLike: (songId: string) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setTheme: (t: ThemeId) => void;
  setViewMode: (mode: 'auto' | 'pc' | 'mobile') => void;
  setSleepTimer: (minutes: number | null) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  clearQueue: () => void;
  setSearchQuery: (q: string) => void;
  setIsLyricsOpen: (open: boolean) => void;
  setIsQueueDrawerOpen: (open: boolean) => void;
  setIsThemeModalOpen: (open: boolean) => void;
  setIsSleepTimerModalOpen: (open: boolean) => void;
  setIsMobileFullPlayerOpen: (open: boolean) => void;
  setIsDemoLimitModalOpen: (open: boolean) => void;
  setIsBuyModalOpen: (open: boolean) => void;
  setIsTopUpModalOpen: (open: boolean) => void;
  setIsLoginModalOpen: (open: boolean) => void;
  setSongToBuy: (s: Song | null) => void;
  setSelectedLrcSong: (s: Song | null) => void;
  setActiveDesktopTab: (tab: ActiveDesktopTab) => void;
  setActiveMobileTab: (tab: ActiveMobileTab) => void;

  // Auth methods
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  registerWithEmail: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string, avatarUrl?: string) => Promise<void>;

  // Store & Wallet
  isSongPurchased: (songId: string) => boolean;
  buySong: (song: Song, priceOverride?: number) => { success: boolean; message: string };
  topUpBalance: (amount: number) => void;

  // Admin CRUD for Songs & Members
  addNewSong: (song: Song) => Promise<{ success: boolean; rtdb?: boolean; firestore?: boolean; error?: string }>;
  editSong: (song: Song) => Promise<{ success: boolean; rtdb?: boolean; firestore?: boolean; error?: string }>;
  removeSong: (songId: string) => Promise<{ success: boolean; error?: string }>;
  syncAllToFirebase: () => Promise<{ success: boolean; rtdb: boolean; firestore: boolean; error?: string; details: string }>;
  seedDefaultSongs: () => Promise<{ success: boolean; error?: string }>;
  updateMemberBalance: (uid: string, newBalance: number) => Promise<void>;
  updateMember: (uid: string, data: { displayName?: string; role?: 'admin' | 'user'; balance?: number }) => Promise<void>;
  removeMember: (uid: string) => Promise<void>;
  toggleMemberRole: (uid: string) => Promise<void>;

  // Audio Format Preference & Crossfade
  preferredAudioFormat: 'MP3' | 'WAV';
  setPreferredAudioFormat: (fmt: 'MP3' | 'WAV') => void;
  songFormatMap: Record<string, 'MP3' | 'WAV'>;
  setSongAudioFormat: (songId: string, format: 'MP3' | 'WAV') => void;
  crossfadeDuration: number;
  setCrossfadeDuration: (sec: number) => void;
  isAudioSettingsModalOpen: boolean;
  setIsAudioSettingsModalOpen: (open: boolean) => void;

  // Custom Playlists
  playlists: Playlist[];
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  playPlaylist: (playlist: Playlist) => void;
  isPlaylistModalOpen: boolean;
  setIsPlaylistModalOpen: (open: boolean) => void;
  songForPlaylistModal: Song | null;
  openAddToPlaylistModal: (song: Song) => void;

  // Deep Linking & Share
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  songToShare: Song | null;
  openShareModal: (song: Song) => void;

  // XuanKen Rewind Listening Stats
  isRewindModalOpen: boolean;
  setIsRewindModalOpen: (open: boolean) => void;
  rewindStats: RewindStats;

  // Vouchers & Coupons
  vouchers: Voucher[];
  applyVoucher: (code: string, currentPrice: number) => { success: boolean; discountAmount: number; finalPrice: number; message: string; voucher?: Voucher };
  addVoucher: (voucher: Voucher) => Promise<void>;
  removeVoucher: (id: string) => Promise<void>;

  // Download
  downloadSong: (song: Song, format?: 'MP3' | 'WAV') => Promise<{ success: boolean; message: string }>;
  isDownloadModalOpen: boolean;
  setIsDownloadModalOpen: (open: boolean) => void;
  songToDownload: Song | null;
  openDownloadModal: (song: Song) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(210);
  const [volume, setVolumeState] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<Song[]>([]);
  const [history, setHistory] = useState<Song[]>([]);
  const [likedSongIds, setLikedSongIds] = useState<string[]>([]);
  const [purchasedSongIds, setPurchasedSongIds] = useState<string[]>([]);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('xuanken_theme') as ThemeId;
      return saved || 'purple';
    } catch (e) {
      return 'purple';
    }
  });
  const [activeDesktopTab, setActiveDesktopTab] = useState<ActiveDesktopTab>('discover');
  const [activeMobileTab, setActiveMobileTab] = useState<ActiveMobileTab>('discover');
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isQueueDrawerOpen, setIsQueueDrawerOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isSleepTimerModalOpen, setIsSleepTimerModalOpen] = useState<boolean>(false);
  const [isMobileFullPlayerOpen, setIsMobileFullPlayerOpen] = useState<boolean>(false);
  const [isDemoLimitModalOpen, setIsDemoLimitModalOpen] = useState<boolean>(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [songToBuy, setSongToBuy] = useState<Song | null>(null);
  const [selectedLrcSong, setSelectedLrcSong] = useState<Song | null>(null);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemainingSeconds, setSleepTimerRemainingSeconds] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Audio Playback Settings: Format & Crossfade
  const [preferredAudioFormat, setPreferredAudioFormatState] = useState<'MP3' | 'WAV'>('MP3');
  const [songFormatMap, setSongFormatMap] = useState<Record<string, 'MP3' | 'WAV'>>({});
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [songToDownload, setSongToDownload] = useState<Song | null>(null);
  const [playbackRate, setPlaybackRateState] = useState<number>(1.0);
  const [crossfadeDuration, setCrossfadeDurationState] = useState<number>(3);
  const [isAudioSettingsModalOpen, setIsAudioSettingsModalOpen] = useState<boolean>(false);

  const openDownloadModal = (song: Song) => {
    setSongToDownload(song);
    setIsDownloadModalOpen(true);
  };

  const setSongAudioFormat = (songId: string, format: 'MP3' | 'WAV') => {
    setSongFormatMap((prev) => ({ ...prev, [songId]: format }));
  };

  // Playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const [songForPlaylistModal, setSongForPlaylistModal] = useState<Song | null>(null);

  // Share & Deep Linking
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [songToShare, setSongToShare] = useState<Song | null>(null);

  // Rewind Listening Stats
  const [isRewindModalOpen, setIsRewindModalOpen] = useState<boolean>(false);
  const [rewindStats, setRewindStats] = useState<RewindStats>(() => {
    try {
      const local = localStorage.getItem('xuanken_music_rewind_v1');
      if (local) return JSON.parse(local);
    } catch (e) {}
    return {
      totalSeconds: 0,
      totalPlays: 0,
      songPlays: {},
      artistPlays: {},
      lastUpdated: new Date().toISOString(),
    };
  });

  // Vouchers
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [viewMode, setViewMode] = useState<'auto' | 'pc' | 'mobile'>('auto');
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  // Auth & Members
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [members, setMembers] = useState<AppUser[]>([]);

  const timerRef = useRef<number | null>(null);
  const sleepTimerIntervalRef = useRef<number | null>(null);
  const hasRandomAutoplayTriggered = useRef<boolean>(false);

  // Resize listener
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveIsMobile = viewMode === 'mobile' || (viewMode === 'auto' && windowWidth < 768);

  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setIsAuthLoading(true);
      if (fbUser) {
        // Fetch existing members
        const allMembers = await MusicService.fetchMembers();
        let currentMember = allMembers.find((m) => m.uid === fbUser.uid || m.email === fbUser.email);

        // All accounts created in Firebase Auth have full Admin permissions
        if (!currentMember) {
          currentMember = {
            uid: fbUser.uid,
            email: fbUser.email || 'admin@xuanken.com',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Admin',
            balance: 500000,
            purchasedSongIds: [],
            role: 'admin',
            createdAt: new Date().toLocaleDateString('vi-VN'),
          };
          const updated = [...allMembers, currentMember];
          setMembers(updated);
          await MusicService.saveMembers(updated);
        } else if (currentMember.role !== 'admin') {
          currentMember = {
            ...currentMember,
            role: 'admin',
            email: fbUser.email || currentMember.email,
          };
          await MusicService.upsertMember(currentMember);
          setMembers((prev) => prev.map((m) => (m.uid === currentMember!.uid ? currentMember! : m)));
        }

        setCurrentUser(currentMember);
        setUserBalance(currentMember.balance);
        setPurchasedSongIds(currentMember.purchasedSongIds || []);
      } else {
        setCurrentUser(null);
        setUserBalance(0);
        setPurchasedSongIds([]);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch initial songs and members with real-time RTDB sync
  useEffect(() => {
    MusicService.fetchSongs().then((loadedSongs) => {
      const validSongs = loadedSongs || [];
      setSongs(validSongs);
      if (validSongs.length > 0) {
        setQueue(validSongs.slice(1));
        const firstSong = validSongs[0];
        setCurrentSong(firstSong);
        setDuration(firstSong.duration && firstSong.duration > 0 ? firstSong.duration : 210);
        setCurrentTime(0);
        setIsPlaying(false);
      } else {
        setQueue([]);
        setCurrentSong(null);
        setIsPlaying(false);
      }
    });

    // Real-time listener for live sync across devices
    const unsubscribeRealtime = MusicService.subscribeToSongs((updatedSongs) => {
      const list = updatedSongs || [];
      setSongs(list);
      setCurrentSong((cur) => {
        if (!cur) return list.length > 0 ? list[0] : null;
        const matched = list.find((s) => s.id === cur.id);
        return matched ? { ...cur, ...matched } : (list.length > 0 ? list[0] : null);
      });
    });

    MusicService.fetchMembers().then((loadedMembers) => {
      setMembers(loadedMembers || []);
    });

    MusicService.fetchPlaylists().then((loadedPlaylists) => {
      setPlaylists(loadedPlaylists || []);
    });

    MusicService.fetchVouchers().then((loadedVouchers) => {
      setVouchers(loadedVouchers || []);
    });

    return () => {
      unsubscribeRealtime();
    };
  }, []);
  const isSongPurchased = (songId: string): boolean => {
    return purchasedSongIds.includes(songId);
  };

  // Auth Methods
  const loginWithEmail = async (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return { success: true, message: 'Đăng nhập thành công!' };
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      let msg = 'Đăng nhập thất bại. Vui lòng kiểm tra email hoặc mật khẩu!';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = 'Sai tài khoản hoặc mật khẩu trên Firebase Auth.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Định dạng email không hợp lệ.';
      }
      return { success: false, message: msg };
    }
  };

  const registerWithEmail = async (email: string, pass: string): Promise<{ success: boolean; message: string }> => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      return { success: true, message: 'Tạo tài khoản thành công!' };
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      let msg = 'Tạo tài khoản thất bại: ' + (error.message || '');
      if (error.code === 'auth/email-already-in-use') {
        msg = 'Email này đã tồn tại trên Firebase Auth, vui lòng chuyển sang Đăng nhập!';
      } else if (error.code === 'auth/weak-password') {
        msg = 'Mật khẩu quá yếu, cần ít nhất 6 ký tự!';
      } else if (error.code === 'auth/operation-not-allowed') {
        msg = 'Chưa bật Email/Password trên Firebase Auth (Hãy vào Firebase Console -> Authentication -> Sign-in method -> Bật Email/Password)!';
      }
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setUserBalance(0);
    setPurchasedSongIds([]);
    if (activeDesktopTab === 'admin') {
      setActiveDesktopTab('discover');
    }
    if (activeMobileTab === 'admin') {
      setActiveMobileTab('discover');
    }
  };

  const updateUserProfile = async (displayName: string, avatarUrl?: string) => {
    if (!currentUser) return;
    const updated: AppUser = {
      ...currentUser,
      displayName: displayName.trim() || currentUser.displayName,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : currentUser.avatarUrl,
    };
    setCurrentUser(updated);
    setMembers((prev) => prev.map((m) => (m.uid === updated.uid ? updated : m)));
    await MusicService.upsertMember(updated);
  };

  const isAdmin = currentUser?.role === 'admin';

  const resolveAudioUrl = (song: Song | null | undefined, format: 'MP3' | 'WAV', purchased: boolean) => {
    if (!song) return '';
    if (format === 'WAV') {
      return (purchased
        ? song.wavUrl || song.mp3Url || song.demoUrl
        : song.demoUrl || song.wavUrl || song.mp3Url) || '';
    }
    return (purchased
      ? song.mp3Url || song.wavUrl || song.demoUrl
      : song.demoUrl || song.mp3Url || song.wavUrl) || '';
  };

  const setPreferredAudioFormat = (fmt: 'MP3' | 'WAV') => {
    setPreferredAudioFormatState(fmt);
    if (currentSong && isPlaying) {
      const activePurchased = isSongPurchased(currentSong.id);
      const songFormat = songFormatMap[currentSong.id] || fmt;
      const activeUrl = resolveAudioUrl(currentSong, songFormat, activePurchased);
      if (activeUrl) {
        audioEngine.playUrl(activeUrl, (dur) => {
          if ((!currentSong.duration || currentSong.duration <= 0) && dur > 60) {
            setDuration(dur);
          }
        });
        audioEngine.seek(currentTime);
      }
    }
  };

  // Playback timer & 60-second Demo cutoff
  useEffect(() => {
    if (isPlaying && currentSong) {
      const activePurchased = isSongPurchased(currentSong.id);
      const songFormat = songFormatMap[currentSong.id] || preferredAudioFormat;
      const activeUrl = resolveAudioUrl(currentSong, songFormat, activePurchased);

      audioEngine.playUrl(activeUrl, (dur) => {
        // Keep full song duration; never overwrite with shorter demo metadata
        if ((!currentSong.duration || currentSong.duration <= 0) && dur > 60) {
          setDuration(dur);
        }
      });

      timerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          const purchased = isSongPurchased(currentSong.id);
          // Requirement 2: Demo 60s limitation - at yellow dot, pop up buy song modal
          if (!purchased && prev >= 60) {
            audioEngine.pause();
            setIsPlaying(false);
            setSongToBuy(currentSong);
            setIsBuyModalOpen(true);
            setIsDemoLimitModalOpen(true);
            return 60;
          }

          if (prev >= duration) {
            handleSongEnd();
            return 0;
          }
          const nextTime = prev + 1;
          audioEngine.updatePositionState(nextTime, duration, playbackRate);
          return nextTime;
        });

        // XuanKen Rewind: accumulate listening seconds
        setRewindStats((prevStats) => {
          const newStats: RewindStats = {
            ...prevStats,
            totalSeconds: (prevStats.totalSeconds || 0) + 1,
            lastUpdated: new Date().toISOString(),
          };
          try {
            localStorage.setItem('xuanken_music_rewind_v1', JSON.stringify(newStats));
          } catch (e) {}
          return newStats;
        });
      }, 1000);
    } else {
      audioEngine.pause();
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, currentSong, duration, purchasedSongIds, playbackRate, preferredAudioFormat, songFormatMap]);

  const handleSongEnd = () => {
    if (repeatMode === 'one') {
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }
    nextSong();
  };

  const playSong = (song: Song, formatOverride?: 'MP3' | 'WAV') => {
    if (formatOverride) {
      setSongFormatMap((prev) => ({ ...prev, [song.id]: formatOverride }));
    }

    // Increment playCount for #xuankenchart ranking and sync to Firebase
    const nextPlayCount = (song.playCount || 0) + 1;
    const activeSong = { ...song, playCount: nextPlayCount };
    setSongs((prev) => prev.map((s) => (s.id === song.id ? activeSong : s)));
    MusicService.incrementPlayCount(song.id, nextPlayCount);

    // Update XuanKen Rewind for play count & artists
    setRewindStats((prevStats) => {
      const songPlays = { ...prevStats.songPlays, [song.id]: (prevStats.songPlays[song.id] || 0) + 1 };
      const artistPlays = { ...prevStats.artistPlays, [song.artists]: (prevStats.artistPlays[song.artists] || 0) + 1 };
      const newStats: RewindStats = {
        ...prevStats,
        totalPlays: (prevStats.totalPlays || 0) + 1,
        songPlays,
        artistPlays,
        lastUpdated: new Date().toISOString(),
      };
      try {
        localStorage.setItem('xuanken_music_rewind_v1', JSON.stringify(newStats));
      } catch (e) {}
      return newStats;
    });

    if (currentSong?.id !== song.id) {
      if (currentSong) {
        setHistory((prev) => [currentSong, ...prev.filter((s) => s.id !== currentSong.id)]);
      }
      setCurrentSong(activeSong);
      setCurrentTime(0);
      // Requirement 2: Always keep full song duration on progress bar (default 210s = 3:30)
      setDuration(song.duration && song.duration > 0 ? song.duration : 210);
    } else {
      setCurrentSong(activeSong);
    }
    setIsPlaying(true);

    const activePurchased = isSongPurchased(song.id);
    const chosenFormat = formatOverride || songFormatMap[song.id] || preferredAudioFormat;
    const activeUrl = resolveAudioUrl(song, chosenFormat, activePurchased);

    audioEngine.playUrl(activeUrl, (dur) => {
      if ((!song.duration || song.duration <= 0) && dur > 60) {
        setDuration(dur);
      }
    });
  };

  const togglePlay = () => {
    if (!currentSong && songs.length > 0) {
      playSong(songs[0]);
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const seekTo = (seconds: number) => {
    if (!currentSong) return;
    const purchased = isSongPurchased(currentSong.id);
    if (!purchased && seconds >= 60) {
      setCurrentTime(60);
      audioEngine.seek(60);
      audioEngine.pause();
      setIsPlaying(false);
      setSongToBuy(currentSong);
      setIsBuyModalOpen(true);
      setIsDemoLimitModalOpen(true);
      return;
    }
    const target = Math.min(duration, Math.max(0, seconds));
    setCurrentTime(target);
    audioEngine.seek(target);
    audioEngine.updatePositionState(target, duration, playbackRate);
  };

  const nextSong = () => {
    if (queue.length === 0) {
      if (repeatMode === 'all') {
        const resetQueue = songs.filter((s) => s.id !== currentSong?.id);
        setQueue(resetQueue);
        if (resetQueue.length > 0) {
          playSong(resetQueue[0]);
        }
      } else {
        setIsPlaying(false);
      }
      return;
    }

    let nextIndex = 0;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    }

    const next = queue[nextIndex];
    const newQueue = queue.filter((_, i) => i !== nextIndex);
    setQueue(newQueue);
    playSong(next);
  };

  const prevSong = () => {
    if (currentTime > 4) {
      seekTo(0);
      return;
    }

    if (history.length > 0) {
      const prev = history[0];
      setHistory((h) => h.slice(1));
      if (currentSong) setQueue((q) => [currentSong, ...q]);
      playSong(prev);
    } else {
      seekTo(0);
    }
  };

  const toggleLike = (songId: string) => {
    setLikedSongIds((prev) =>
      prev.includes(songId) ? prev.filter((id) => id !== songId) : [...prev, songId]
    );
  };

  const toggleShuffle = () => setIsShuffle((prev) => !prev);

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    audioEngine.setVolume(val);
    if (isMuted && val > 0) {
      setIsMuted(false);
      audioEngine.setMuted(false);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioEngine.setMuted(nextMuted);
  };

  const setTheme = (t: ThemeId) => {
    setThemeState(t);
    try {
      document.documentElement.setAttribute('data-theme', t);
      document.body.setAttribute('data-theme', t);
      localStorage.setItem('xuanken_theme', t);
    } catch (e) {}
  };

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
      localStorage.setItem('xuanken_theme', theme);
    } catch (e) {}
  }, [theme]);

  const setSleepTimer = (minutes: number | null) => {
    setSleepTimerMinutes(minutes);
    if (minutes === null) {
      setSleepTimerRemainingSeconds(null);
    } else {
      setSleepTimerRemainingSeconds(minutes * 60);
    }
  };

  const addToQueue = (song: Song) => {
    setQueue((prev) => (prev.some((s) => s.id === song.id) ? prev : [...prev, song]));
  };

  const removeFromQueue = (songId: string) => {
    setQueue((prev) => prev.filter((s) => s.id !== songId));
  };

  const clearQueue = () => setQueue([]);

  // Store Buy Song
  const buySong = (song: Song, priceOverride?: number): { success: boolean; message: string } => {
    if (purchasedSongIds.includes(song.id)) {
      return { success: true, message: 'Bạn đã sở hữu bài hát này!' };
    }

    const priceToPay = priceOverride !== undefined ? priceOverride : (song.price ?? 20000);

    if (userBalance < priceToPay) {
      setIsTopUpModalOpen(true);
      return { success: false, message: 'Số dư không đủ. Vui lòng nạp thêm tiền!' };
    }

    const newBalance = userBalance - priceToPay;
    const newPurchased = [...purchasedSongIds, song.id];
    setUserBalance(newBalance);
    setPurchasedSongIds(newPurchased);

    if (currentUser) {
      const updatedUser: AppUser = {
        ...currentUser,
        balance: newBalance,
        purchasedSongIds: newPurchased,
      };
      setCurrentUser(updatedUser);
      MusicService.upsertMember(updatedUser);
    }

    setIsDemoLimitModalOpen(false);
    setIsBuyModalOpen(false);

    return {
      success: true,
      message: `Mua bài hát "${song.title}" thành công! Bây giờ bạn có thể nghe full và tải về chất lượng ${song.audioFormat}.`,
    };
  };

  const topUpBalance = (amount: number) => {
    const newBal = userBalance + amount;
    setUserBalance(newBal);
    if (currentUser) {
      const updatedUser: AppUser = {
        ...currentUser,
        balance: newBal,
      };
      setCurrentUser(updatedUser);
      MusicService.upsertMember(updatedUser);
    }
  };

  // Song CRUD
  const addNewSong = async (newSong: Song) => {
    const updated = [newSong, ...songs];
    setSongs(updated);
    if (!currentSong) {
      setCurrentSong(newSong);
    }
    const result = await MusicService.saveSongsToFirebase(updated);
    return result;
  };

  const editSong = async (updatedSong: Song) => {
    const updated = songs.map((s) => (s.id === updatedSong.id ? updatedSong : s));
    setSongs(updated);
    if (currentSong?.id === updatedSong.id) {
      setCurrentSong(updatedSong);
    }
    const result = await MusicService.saveSongsToFirebase(updated);
    return result;
  };

  const removeSong = async (songId: string) => {
    const updated = songs.filter((s) => s.id !== songId);
    setSongs(updated);
    if (currentSong?.id === songId) {
      if (updated.length > 0) {
        playSong(updated[0]);
      } else {
        setCurrentSong(null);
        setIsPlaying(false);
      }
    }
    const result = await MusicService.saveSongsToFirebase(updated);
    await MusicService.deleteSong(songId);
    return result;
  };

  // Sync all state to Firebase in 1 click
  const syncAllToFirebase = async () => {
    return await MusicService.syncAllToFirebase(songs, members, playlists, vouchers);
  };

  // Seed sample songs to Firebase if empty
  const seedDefaultSongs = async () => {
    const sampleSongs: Song[] = [
      {
        id: 'song-xk-01',
        stt: 1,
        title: 'Cơn Mưa Ngang Qua',
        artists: 'Sơn Tùng M-TP',
        album: 'XuanKen Official',
        duration: 215,
        audioFormat: 'MP3',
        price: 20000,
        playCount: 1420,
        coverImage: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png',
        coverGradient: 'from-purple-600 via-pink-600 to-indigo-800',
        demoUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo1.mp3',
        mp3Url: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo1.mp3',
        wavUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo1.mp3',
        lrcRaw: '[00:00.00] Cơn Mưa Ngang Qua - Sơn Tùng M-TP\n[00:15.00] Cơn mưa ngang qua, mang em đi xa...\n[00:30.00] Nụ cười ngày nào giờ đã phai nhoà...\n[00:45.00] Anh đứng đây một mình trong bóng tối...',
        lyrics: [
          { time: 0, text: 'Cơn Mưa Ngang Qua - Sơn Tùng M-TP' },
          { time: 15, text: 'Cơn mưa ngang qua, mang em đi xa...' },
          { time: 30, text: 'Nụ cười ngày nào giờ đã phai nhoà...' },
          { time: 45, text: 'Anh đứng đây một mình trong bóng tối...' },
        ],
        releaseDate: '2026',
        plays: '1.4K lượt nghe',
      },
      {
        id: 'song-xk-02',
        stt: 2,
        title: 'Nơi Này Có Anh',
        artists: 'Sơn Tùng M-TP',
        album: 'XuanKen Master Studio',
        duration: 250,
        audioFormat: 'WAV',
        price: 35000,
        playCount: 2850,
        coverImage: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png',
        coverGradient: 'from-amber-500 via-red-600 to-purple-800',
        demoUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo2.mp3',
        mp3Url: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo2.mp3',
        wavUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo2.mp3',
        lrcRaw: '[00:00.00] Nơi Này Có Anh - Sơn Tùng M-TP\n[00:18.00] Em là ai từ đâu bước đến nơi đây dịu dàng chói chang...\n[00:35.00] Nụ cười ba mươi giây làm anh ngây ngất...\n[00:50.00] Cầm tay anh dựa vai anh kề bên anh mãi thôi...',
        lyrics: [
          { time: 0, text: 'Nơi Này Có Anh - Sơn Tùng M-TP' },
          { time: 18, text: 'Em là ai từ đâu bước đến nơi đây dịu dàng chói chang...' },
          { time: 35, text: 'Nụ cười ba mươi giây làm anh ngây ngất...' },
          { time: 50, text: 'Cầm tay anh dựa vai anh kề bên anh mãi thôi...' },
        ],
        releaseDate: '2026',
        plays: '2.8K lượt nghe',
      },
      {
        id: 'song-xk-03',
        stt: 3,
        title: 'Chúng Ta Của Hiện Tại',
        artists: 'Sơn Tùng M-TP',
        album: 'XuanKen Lossless 2026',
        duration: 300,
        audioFormat: 'WAV',
        price: 50000,
        playCount: 3900,
        coverImage: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png',
        coverGradient: 'from-blue-600 via-cyan-600 to-indigo-900',
        demoUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo3.mp3',
        mp3Url: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo3.mp3',
        wavUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/demo3.mp3',
        lrcRaw: '[00:00.00] Chúng Ta Của Hiện Tại - Sơn Tùng M-TP\n[00:20.00] Mùa thu mang giấc mơ quay về...\n[00:40.00] Vẫn nguyên vẹn như hôm nào...\n[00:58.00] Điều anh luôn giữ kín trong tim...',
        lyrics: [
          { time: 0, text: 'Chúng Ta Của Hiện Tại - Sơn Tùng M-TP' },
          { time: 20, text: 'Mùa thu mang giấc mơ quay về...' },
          { time: 40, text: 'Vẫn nguyên vẹn như hôm nào...' },
          { time: 58, text: 'Điều anh luôn giữ kín trong tim...' },
        ],
        releaseDate: '2026',
        plays: '3.9K lượt nghe',
      },
    ];

    setSongs(sampleSongs);
    setCurrentSong(sampleSongs[0]);
    setQueue(sampleSongs.slice(1));
    return await MusicService.saveSongsToFirebase(sampleSongs);
  };

  const updateMemberBalance = async (uid: string, newBalance: number) => {
    const updated = members.map((m) => (m.uid === uid ? { ...m, balance: newBalance } : m));
    setMembers(updated);
    if (currentUser?.uid === uid) {
      setCurrentUser({ ...currentUser, balance: newBalance });
      setUserBalance(newBalance);
    }
    await MusicService.saveMembers(updated);
  };

  const updateMember = async (uid: string, data: { displayName?: string; role?: 'admin' | 'user'; balance?: number }) => {
    const updated = members.map((m) => {
      if (m.uid === uid) {
        return {
          ...m,
          displayName: data.displayName !== undefined ? data.displayName : m.displayName,
          role: data.role !== undefined ? data.role : m.role,
          balance: data.balance !== undefined ? data.balance : m.balance,
        };
      }
      return m;
    });
    setMembers(updated);
    if (currentUser?.uid === uid) {
      const updatedCurrent = updated.find((m) => m.uid === uid);
      if (updatedCurrent) {
        setCurrentUser(updatedCurrent);
        if (data.balance !== undefined) {
          setUserBalance(data.balance);
        }
      }
    }
    await MusicService.saveMembers(updated);
  };

  const removeMember = async (uid: string) => {
    const updated = members.filter((m) => m.uid !== uid);
    setMembers(updated);
    await MusicService.deleteMember(uid);
  };

  const toggleMemberRole = async (uid: string) => {
    const updated = members.map((m) => {
      if (m.uid === uid) {
        const nextRole: 'admin' | 'user' = m.role === 'admin' ? 'user' : 'admin';
        return { ...m, role: nextRole };
      }
      return m;
    });
    setMembers(updated);
    if (currentUser?.uid === uid) {
      const updatedCurrent = updated.find((m) => m.uid === uid);
      if (updatedCurrent) setCurrentUser(updatedCurrent);
    }
    await MusicService.saveMembers(updated);
  };


  // 1. Media Session API for Lockscreen and System Controls
  useEffect(() => {
    audioEngine.updateMediaSession(currentSong, isPlaying, {
      onPlay: () => setIsPlaying(true),
      onPause: () => setIsPlaying(false),
      onPrev: prevSong,
      onNext: nextSong,
      onSeek: seekTo,
    });
  }, [currentSong, isPlaying]);

  // 2. Deep Linking (?song=song-id or ?playlist=playlist-id)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const songParam = params.get('song');
      if (songParam && songs.length > 0) {
        const found = songs.find((s) => s.id === songParam || s.id === `song-${songParam}`);
        if (found) {
          setCurrentSong(found);
          setDuration(found.duration && found.duration > 0 ? found.duration : 210);
        }
      }
    } catch (e) {}
  }, [songs]);

  // 3. Playback Rate & Crossfade setters
  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    audioEngine.setPlaybackRate(rate);
  };

  const setCrossfadeDuration = (sec: number) => {
    setCrossfadeDurationState(sec);
    audioEngine.setCrossfadeDuration(sec);
  };

  // 4. Custom Playlists Handlers
  const createPlaylist = async (name: string, description?: string): Promise<Playlist> => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name: name.trim() || 'Playlist Mới',
      description: description?.trim() || '',
      coverImage: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png',
      songIds: [],
      userId: currentUser?.uid,
      createdAt: new Date().toISOString(),
    };
    const updated = [newPlaylist, ...playlists];
    setPlaylists(updated);
    await MusicService.upsertPlaylist(newPlaylist);
    return newPlaylist;
  };

  const deletePlaylist = async (id: string) => {
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    await MusicService.deletePlaylist(id);
  };

  const addSongToPlaylist = async (playlistId: string, songId: string) => {
    const target = playlists.find((p) => p.id === playlistId);
    if (!target) return;
    if (target.songIds.includes(songId)) return;
    const updated: Playlist = {
      ...target,
      songIds: [...target.songIds, songId],
    };
    const nextList = playlists.map((p) => (p.id === playlistId ? updated : p));
    setPlaylists(nextList);
    await MusicService.upsertPlaylist(updated);
  };

  const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
    const target = playlists.find((p) => p.id === playlistId);
    if (!target) return;
    const updated: Playlist = {
      ...target,
      songIds: target.songIds.filter((id) => id !== songId),
    };
    const nextList = playlists.map((p) => (p.id === playlistId ? updated : p));
    setPlaylists(nextList);
    await MusicService.upsertPlaylist(updated);
  };

  const playPlaylist = (playlist: Playlist) => {
    const pSongs = songs.filter((s) => playlist.songIds.includes(s.id));
    if (pSongs.length > 0) {
      setQueue(pSongs.slice(1));
      playSong(pSongs[0]);
    }
  };

  const openAddToPlaylistModal = (song: Song) => {
    setSongForPlaylistModal(song);
    setIsPlaylistModalOpen(true);
  };

  // 5. Deep Linking & Share Modal
  const openShareModal = (song: Song) => {
    setSongToShare(song);
    setIsShareModalOpen(true);
  };

  // 6. Vouchers Handlers
  const applyVoucher = (code: string, currentPrice: number) => {
    const cleanCode = code.trim().toUpperCase();
    const found = vouchers.find((v) => v.code.toUpperCase() === cleanCode && v.isActive);
    if (!found) {
      return {
        success: false,
        discountAmount: 0,
        finalPrice: currentPrice,
        message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.',
      };
    }

    let discount = 0;
    if (found.discountType === 'percent') {
      discount = Math.round(currentPrice * (found.discountValue / 100));
    } else {
      discount = found.discountValue;
    }

    discount = Math.min(discount, currentPrice);
    const finalPrice = Math.max(0, currentPrice - discount);

    return {
      success: true,
      discountAmount: discount,
      finalPrice,
      message: `Áp dụng thành công: ${found.description}`,
      voucher: found,
    };
  };

  const addVoucher = async (voucher: Voucher) => {
    const updated = [voucher, ...vouchers.filter((v) => v.id !== voucher.id)];
    setVouchers(updated);
    await MusicService.upsertVoucher(voucher);
  };

  const removeVoucher = async (id: string) => {
    const updated = vouchers.filter((v) => v.id !== id);
    setVouchers(updated);
    await MusicService.deleteVoucher(id);
  };

  // 7. Download Song
  const downloadSong = async (song: Song, format: 'MP3' | 'WAV' = 'MP3') => {
    return MusicService.downloadSongAudio(song, format);
  };

  return (
    <MusicContext.Provider
      value={{
        songs,
        currentSong,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isShuffle,
        repeatMode,
        queue,
        history,
        likedSongIds,
        purchasedSongIds,
        theme,
        activeDesktopTab,
        activeMobileTab,
        isLyricsOpen,
        isQueueDrawerOpen,
        isThemeModalOpen,
        isSleepTimerModalOpen,
        isMobileFullPlayerOpen,
        isDemoLimitModalOpen,
        isBuyModalOpen,
        isTopUpModalOpen,
        isLoginModalOpen,
        songToBuy,
        selectedLrcSong,
        sleepTimerMinutes,
        sleepTimerRemainingSeconds,
        searchQuery,
        viewMode,
        effectiveIsMobile,
        currentUser,
        isAdmin,
        isAuthLoading,
        members,
        userBalance,
        playSong,
        togglePlay,
        seekTo,
        nextSong,
        prevSong,
        toggleLike,
        toggleShuffle,
        toggleRepeat,
        setVolume,
        toggleMute,
        setTheme,
        setViewMode,
        setSleepTimer,
        addToQueue,
        removeFromQueue,
        clearQueue,
        setSearchQuery,
        setIsLyricsOpen,
        setIsQueueDrawerOpen,
        setIsThemeModalOpen,
        setIsSleepTimerModalOpen,
        setIsMobileFullPlayerOpen,
        setIsDemoLimitModalOpen,
        setIsBuyModalOpen,
        setIsTopUpModalOpen,
        setIsLoginModalOpen,
        setSongToBuy,
        setSelectedLrcSong,
        setActiveDesktopTab,
        setActiveMobileTab,
        loginWithEmail,
        registerWithEmail,
        logout,
        updateUserProfile,
        isSongPurchased,
        buySong,
        topUpBalance,
        addNewSong,
        editSong,
        removeSong,
        syncAllToFirebase,
        seedDefaultSongs,
        updateMemberBalance,
        updateMember,
        removeMember,
        toggleMemberRole,
        preferredAudioFormat,
        setPreferredAudioFormat,
        crossfadeDuration,
        setCrossfadeDuration,
        isAudioSettingsModalOpen,
        setIsAudioSettingsModalOpen,
        playlists,
        createPlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        playPlaylist,
        isPlaylistModalOpen,
        setIsPlaylistModalOpen,
        songForPlaylistModal,
        openAddToPlaylistModal,
        isShareModalOpen,
        setIsShareModalOpen,
        songToShare,
        openShareModal,
        isRewindModalOpen,
        setIsRewindModalOpen,
        rewindStats,
        vouchers,
        applyVoucher,
        addVoucher,
        removeVoucher,
        downloadSong,
        songFormatMap,
        setSongAudioFormat,
        isDownloadModalOpen,
        setIsDownloadModalOpen,
        songToDownload,
        openDownloadModal,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
};
