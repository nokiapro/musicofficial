import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Song, AppUser, ThemeId, RepeatMode, ActiveDesktopTab, ActiveMobileTab } from '../types/music';
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

  playSong: (song: Song) => void;
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
  logout: () => Promise<void>;

  // Store & Wallet
  isSongPurchased: (songId: string) => boolean;
  buySong: (song: Song) => { success: boolean; message: string };
  topUpBalance: (amount: number) => void;

  // Admin CRUD for Songs & Members
  addNewSong: (song: Song) => Promise<void>;
  editSong: (song: Song) => Promise<void>;
  removeSong: (songId: string) => Promise<void>;
  updateMemberBalance: (uid: string, newBalance: number) => Promise<void>;
  updateMember: (uid: string, data: { displayName?: string; role?: 'admin' | 'user'; balance?: number }) => Promise<void>;
  removeMember: (uid: string) => Promise<void>;
  toggleMemberRole: (uid: string) => Promise<void>;
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
  const [theme, setThemeState] = useState<ThemeId>('purple');
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

        const emailLower = fbUser.email?.toLowerCase() || '';
        const isMasterAdmin =
          emailLower === 'xuankensinger@gmail.com' || emailLower.includes('admin');

        if (!currentMember) {
          currentMember = {
            uid: fbUser.uid,
            email: fbUser.email || 'user@xuanken.com',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Member',
            balance: 50000,
            purchasedSongIds: [],
            role: isMasterAdmin ? 'admin' : 'user',
            createdAt: new Date().toLocaleDateString('vi-VN'),
          };
          const updated = [...allMembers, currentMember];
          setMembers(updated);
          await MusicService.saveMembers(updated);
        } else if (isMasterAdmin && currentMember.role !== 'admin') {
          currentMember.role = 'admin';
          await MusicService.upsertMember(currentMember);
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
      setSongs(loadedSongs || []);
      if (loadedSongs && loadedSongs.length > 0) {
        setQueue(loadedSongs.slice(1));
        // Requirement 7: Random autoplay if songs exist
        if (!hasRandomAutoplayTriggered.current) {
          hasRandomAutoplayTriggered.current = true;
          const randomIndex = Math.floor(Math.random() * loadedSongs.length);
          const randomSong = loadedSongs[randomIndex];
          setCurrentSong(randomSong);
          setDuration(randomSong.duration && randomSong.duration > 0 ? randomSong.duration : 210);
          setCurrentTime(0);

          setIsPlaying(true);
          const activeUrl = randomSong.demoUrl || randomSong.mp3Url || randomSong.wavUrl;
          audioEngine.playUrl(activeUrl, (dur) => {
            if ((!randomSong.duration || randomSong.duration <= 0) && dur > 60) {
              setDuration(dur);
            }
          });
        }
      }
    });

    // Real-time listener for live sync across devices
    const unsubscribeRealtime = MusicService.subscribeToSongs((updatedSongs) => {
      if (updatedSongs && updatedSongs.length > 0) {
        setSongs(updatedSongs);
        setCurrentSong((cur) => {
          if (!cur) return null;
          const matched = updatedSongs.find((s) => s.id === cur.id);
          return matched ? { ...cur, ...matched } : cur;
        });
      }
    });

    MusicService.fetchMembers().then((loadedMembers) => {
      setMembers(loadedMembers || []);
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

  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    if (activeDesktopTab === 'admin') {
      setActiveDesktopTab('discover');
    }
    if (activeMobileTab === 'admin') {
      setActiveMobileTab('discover');
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  // Playback timer & 60-second Demo cutoff
  useEffect(() => {
    if (isPlaying && currentSong) {
      const activePurchased = isSongPurchased(currentSong.id);
      const activeUrl = activePurchased
        ? currentSong.wavUrl || currentSong.mp3Url || currentSong.demoUrl
        : currentSong.demoUrl || currentSong.mp3Url;

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
          return prev + 1;
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
  }, [isPlaying, currentSong, duration, purchasedSongIds]);

  const handleSongEnd = () => {
    if (repeatMode === 'one') {
      setCurrentTime(0);
      setIsPlaying(true);
      return;
    }
    nextSong();
  };

  const playSong = (song: Song) => {
    // Increment playCount for #xuankenchart ranking and sync to Firebase
    const nextPlayCount = (song.playCount || 0) + 1;
    const activeSong = { ...song, playCount: nextPlayCount };
    setSongs((prev) => prev.map((s) => (s.id === song.id ? activeSong : s)));
    MusicService.incrementPlayCount(song.id, nextPlayCount);

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
    const activeUrl = activePurchased
      ? song.wavUrl || song.mp3Url || song.demoUrl
      : song.demoUrl || song.mp3Url;

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

  const setTheme = (t: ThemeId) => setThemeState(t);

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
  const buySong = (song: Song): { success: boolean; message: string } => {
    if (purchasedSongIds.includes(song.id)) {
      return { success: true, message: 'Bạn đã sở hữu bài hát này!' };
    }

    if (userBalance < song.price) {
      setIsTopUpModalOpen(true);
      return { success: false, message: 'Số dư không đủ. Vui lòng nạp thêm tiền!' };
    }

    const newBalance = userBalance - song.price;
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
    await MusicService.saveSongsToFirebase(updated);
  };

  const editSong = async (updatedSong: Song) => {
    const updated = songs.map((s) => (s.id === updatedSong.id ? updatedSong : s));
    setSongs(updated);
    if (currentSong?.id === updatedSong.id) {
      setCurrentSong(updatedSong);
    }
    await MusicService.saveSongsToFirebase(updated);
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
    await MusicService.saveSongsToFirebase(updated);
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
        logout,
        isSongPurchased,
        buySong,
        topUpBalance,
        addNewSong,
        editSong,
        removeSong,
        updateMemberBalance,
        updateMember,
        removeMember,
        toggleMemberRole,
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
