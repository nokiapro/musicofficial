import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { Song, AppUser, ThemeId, RepeatMode, ActiveDesktopTab, ActiveMobileTab, Playlist, Voucher, SiteSettings, ExclusiveAlbum, AlbumSong, ChatMessage, ArtistBio } from '../types/music';
import { auth } from '../services/firebase';
import { audioEngine } from '../services/audioEngine';
import { MusicService } from '../services/musicService';

// Danh sách Super Admin toàn quyền vĩnh viễn
// Bạn có thể thêm bất kỳ email nào vào mảng này để có toàn quyền như Admin chính!
export const PRIMARY_ADMIN_EMAILS: string[] = [
  'admin@xuanken.vn',
  'phamthikimthanh.qy@gmail.com',
];

export const isSuperAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  return PRIMARY_ADMIN_EMAILS.some((adm) => adm.toLowerCase().trim() === clean);
};

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
  canGoBack: boolean;
  canGoForward: boolean;
  navigateBack: () => void;
  navigateForward: () => void;
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
  allSearchableSongs: Song[];
  playbackSource: string;
  setPlaybackSource: (source: string) => void;
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
  setSleepTimerSeconds: (seconds: number | null) => void;
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
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  setSongToBuy: (s: Song | null) => void;
  setSelectedLrcSong: (s: Song | null) => void;
  setActiveDesktopTab: (tab: ActiveDesktopTab) => void;
  setActiveMobileTab: (tab: ActiveMobileTab) => void;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;

  // Auth methods
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  registerWithEmail: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string, avatarUrl?: string) => Promise<void>;

  // Store & Wallet
  isSongPurchased: (songId: string) => boolean;
  buySong: (song: Song, priceOverride?: number, voucherCodeApplied?: string) => { success: boolean; message: string };
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
  addAdminByEmail: (email: string) => Promise<{ success: boolean; message: string }>;

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
  selectedPlaylist: Playlist | null;
  setSelectedPlaylist: (playlist: Playlist | null) => void;
  createPlaylist: (name: string, description?: string) => Promise<Playlist>;
  deletePlaylist: (id: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, songId: string) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  playPlaylist: (playlist: Playlist, mode?: 'order' | 'shuffle') => void;
  isPlaylistModalOpen: boolean;
  setIsPlaylistModalOpen: (open: boolean) => void;
  songForPlaylistModal: Song | null;
  openAddToPlaylistModal: (song: Song) => void;

  // Deep Linking & Share
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  songToShare: Song | null;
  openShareModal: (song: Song) => void;

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

  // Weekly Top (Requirement 22)
  weeklyPlays: Record<string, number>;
  currentWeekKey: string;

  // Blocked Songs (Requirement 20)
  blockedSongIds: string[];
  blockSong: (songId: string) => void;
  unblockSong: (songId: string) => void;
  isSongBlocked: (songId: string) => boolean;

  // Report Issue (Requirement 20)
  reportSongIssue: (songId: string, issue: string) => Promise<{ success: boolean; message: string }>;

  // Site Settings (Requirement 11)
  siteSettings: SiteSettings;
  updateSiteSettings: (settings: Partial<SiteSettings>) => Promise<void>;

  // Exclusive / Curated Albums (Album Nhạc Hay - Strict Isolation)
  exclusiveAlbums: ExclusiveAlbum[];
  selectedAlbum: ExclusiveAlbum | null;
  setSelectedAlbum: (album: ExclusiveAlbum | null) => void;
  addExclusiveAlbum: (albumData: Omit<ExclusiveAlbum, 'id' | 'createdAt' | 'songs'>) => Promise<ExclusiveAlbum>;
  updateExclusiveAlbum: (id: string, albumData: Partial<ExclusiveAlbum>) => Promise<void>;
  deleteExclusiveAlbum: (id: string) => Promise<void>;
  addSongToAlbum: (albumId: string, songData: Omit<AlbumSong, 'id' | 'albumId' | 'createdAt'>) => Promise<AlbumSong>;
  updateSongInAlbum: (albumId: string, songId: string, songData: Partial<AlbumSong>) => Promise<void>;
  removeSongFromAlbum: (albumId: string, songId: string) => Promise<void>;
  reorderSongInAlbum: (albumId: string, songId: string, direction: 'up' | 'down') => Promise<void>;
  seedDefaultAlbums: () => Promise<{ success: boolean; error?: string }>;
  syncExclusiveAlbumsToFirebase: () => Promise<{ success: boolean; rtdb: boolean; firestore: boolean; error?: string }>;
  playAlbumTrack: (track: AlbumSong, album: ExclusiveAlbum, shuffle?: boolean) => void;
  playCustomPool: (poolList: Song[], sourceName: string, shuffleMode?: boolean, startSong?: Song) => void;

  // Community Chat Box
  chatMessages: ChatMessage[];
  sendChatMessage: (content: string, sharedSong?: ChatMessage['sharedSong']) => Promise<void>;
  editChatMessage: (id: string, newContent: string) => Promise<void>;
  deleteChatMessage: (id: string) => Promise<void>;
  togglePinChatMessage: (id: string, isPinned: boolean) => Promise<void>;
  banChatMember: (userId: string, userName: string, durationMinutes: number | null) => Promise<void>;
  unbanChatMember: (userId: string) => Promise<void>;
  bannedMembers: Record<string, { bannedUntil: number | null; bannedAt: number; userName: string }>;

  // Artist Biographies (Tiểu Sử Ca Sĩ)
  artistBios: ArtistBio[];
  selectedArtistName: string | null;
  setSelectedArtistName: (name: string | null) => void;
  navigateToArtist: (artistName: string) => void;
  upsertArtistBio: (bio: ArtistBio) => Promise<void>;
  deleteArtistBio: (id: string) => Promise<void>;
}

const MusicContext = createContext<MusicContextType | null>(null);

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'XuanKen Music',
  siteSlogan: 'Nghe & Mua Nhạc Bản Quyền',
  logoUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png',
  faviconUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png',
  defaultStartingBalance: 500000,
  defaultSongPrice: 20000,
  minListenDurationSeconds: 5,
};

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
  const [likedSongIds, setLikedSongIds] = useState<string[]>(() => {
    try {
      const parseKey = (k: string): string[] => {
        const raw = localStorage.getItem(k);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
      };
      const merged = Array.from(new Set([...parseKey('xuanken_liked_v2'), ...parseKey('xuanken_liked_guest')]));
      return merged;
    } catch (e) {}
    return [];
  });
  const [purchasedSongIds, setPurchasedSongIds] = useState<string[]>([]);
  const [blockedSongIds, setBlockedSongIds] = useState<string[]>(() => {
    try {
      const local = localStorage.getItem('xuanken_blocked_songs');
      return local ? JSON.parse(local) : [];
    } catch (e) {
      return [];
    }
  });
  const [userBalance, setUserBalance] = useState<number>(0);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const local = localStorage.getItem('xuanken_site_settings');
      if (local) return { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(local) };
    } catch (e) {}
    return DEFAULT_SITE_SETTINGS;
  });
  const [theme, setThemeState] = useState<ThemeId>(() => {
    try {
      const saved = localStorage.getItem('xuanken_theme') as ThemeId;
      return saved || 'purple';
    } catch (e) {
      return 'purple';
    }
  });
  const [activeDesktopTab, setActiveDesktopTabState] = useState<ActiveDesktopTab>('discover');
  const [tabHistory, setTabHistory] = useState<ActiveDesktopTab[]>(['discover']);
  const [tabHistoryIndex, setTabHistoryIndex] = useState<number>(0);

  const setActiveDesktopTab = (newTab: ActiveDesktopTab) => {
    setActiveDesktopTabState(newTab);
    setTabHistory((prev) => {
      const upToCurrent = prev.slice(0, tabHistoryIndex + 1);
      if (upToCurrent.length > 0 && upToCurrent[upToCurrent.length - 1] === newTab) {
        return upToCurrent;
      }
      const updated = [...upToCurrent, newTab];
      setTabHistoryIndex(updated.length - 1);
      return updated;
    });
  };
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [bannedMembers, setBannedMembers] = useState<Record<string, { bannedUntil: number | null; bannedAt: number; userName: string }>>({});
  const [songToBuy, setSongToBuy] = useState<Song | null>(null);
  const [selectedLrcSong, setSelectedLrcSong] = useState<Song | null>(null);
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemainingSeconds, setSleepTimerRemainingSeconds] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playbackSource, setPlaybackSource] = useState<string>('Bài hát gợi ý');

  // Audio Playback Settings: Format & Crossfade (Requirement 5)
  const [preferredAudioFormat, setPreferredAudioFormatState] = useState<'MP3' | 'WAV'>(() => {
    try {
      const saved = localStorage.getItem('xuanken_preferred_audio_format');
      if (saved === 'WAV' || saved === 'MP3') return saved;
    } catch (e) {}
    return 'MP3';
  });
  const [songFormatMap, setSongFormatMap] = useState<Record<string, 'MP3' | 'WAV'>>(() => {
    try {
      const saved = localStorage.getItem('xuanken_song_format_map');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {};
  });
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [songToDownload, setSongToDownload] = useState<Song | null>(null);
  const [playbackRate, setPlaybackRateState] = useState<number>(1.0);
  const [crossfadeDuration, setCrossfadeDurationState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('xuanken_crossfade_duration');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0) return parsed;
      }
    } catch (e) {}
    return 3;
  });
  const [isAudioSettingsModalOpen, setIsAudioSettingsModalOpen] = useState<boolean>(false);

  const openDownloadModal = (song: Song) => {
    setSongToDownload(song);
    setIsDownloadModalOpen(true);
  };

  const setSongAudioFormat = (songId: string, format: 'MP3' | 'WAV') => {
    setSongFormatMap((prev) => {
      const updated = { ...prev, [songId]: format };
      MusicService.saveAudioSettings(preferredAudioFormat, updated, currentUser?.uid, crossfadeDuration);
      return updated;
    });
  };

  // Playlists
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const [songForPlaylistModal, setSongForPlaylistModal] = useState<Song | null>(null);

  // Share & Deep Linking
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [songToShare, setSongToShare] = useState<Song | null>(null);

  // Vouchers

  // Vouchers
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [viewMode, setViewMode] = useState<'auto' | 'pc' | 'mobile'>('auto');
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);

  // Auth & Members
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [members, setMembers] = useState<AppUser[]>(() => {
    try {
      const cached = localStorage.getItem('xuanken_music_members_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          return parsed.map((m: any) => {
            try {
              const localBal = localStorage.getItem(`xuanken_member_balance_${m.uid}`);
              if (localBal !== null) {
                const num = parseInt(localBal, 10);
                if (!isNaN(num)) return { ...m, balance: num };
              }
            } catch (e) {}
            return m;
          });
        }
      }
    } catch (e) {}
    return [];
  });

  const [activePlaylistSongs, setActivePlaylistSongs] = useState<Song[]>([]);

  // Exclusive / Curated Albums (Album Nhạc Hay - Strict Isolation)
  const [exclusiveAlbums, setExclusiveAlbums] = useState<ExclusiveAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<ExclusiveAlbum | null>(null);

  // Artist Biographies (Tiểu Sử Ca Sĩ)
  const [artistBios, setArtistBios] = useState<ArtistBio[]>([]);
  const [selectedArtistName, setSelectedArtistName] = useState<string | null>(null);

  const navigateToArtist = (artistName: string) => {
    const cleanName = (artistName || '').trim();
    if (!cleanName) return;
    setSelectedArtistName(cleanName);
    setActiveDesktopTab('artists');
    setActiveMobileTab('artists');
  };

  const upsertArtistBio = async (bio: ArtistBio) => {
    await MusicService.upsertArtistBio(bio);
    setArtistBios((prev) => {
      const idx = prev.findIndex((b) => b.id === bio.id || b.name.toLowerCase() === bio.name.toLowerCase());
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = bio;
        return updated;
      }
      return [...prev, bio];
    });
  };

  const deleteArtistBio = async (id: string) => {
    await MusicService.deleteArtistBio(id);
    setArtistBios((prev) => prev.filter((b) => b.id !== id));
    if (selectedArtistName) {
      const deleted = artistBios.find((b) => b.id === id);
      if (deleted && deleted.name.toLowerCase() === selectedArtistName.toLowerCase()) {
        setSelectedArtistName(null);
      }
    }
  };

  const canGoBack = Boolean(selectedAlbum) || Boolean(selectedArtistName) || Boolean(selectedPlaylist) || tabHistoryIndex > 0;
  const canGoForward = tabHistoryIndex < tabHistory.length - 1;

  const navigateBack = () => {
    if (selectedAlbum) {
      setSelectedAlbum(null);
      return;
    }
    if (selectedArtistName) {
      setSelectedArtistName(null);
      return;
    }
    if (selectedPlaylist) {
      setSelectedPlaylist(null);
      return;
    }
    if (tabHistoryIndex > 0) {
      const newIdx = tabHistoryIndex - 1;
      setTabHistoryIndex(newIdx);
      setActiveDesktopTabState(tabHistory[newIdx]);
    }
  };

  const navigateForward = () => {
    if (tabHistoryIndex < tabHistory.length - 1) {
      const newIdx = tabHistoryIndex + 1;
      setTabHistoryIndex(newIdx);
      setActiveDesktopTabState(tabHistory[newIdx]);
    }
  };

  // Community Chat Messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const timerRef = useRef<number | null>(null);
  // Requirement 8: Nghe đủ 5 giây trở lên mới tính là 1 lượt nghe
  const hasCountedPlayRef = useRef<boolean>(false);
  const lastEndedTimestampRef = useRef<number>(0);
  // Requirement 4: Track recently played songs in random/shuffle mode to prevent ping-ponging (e.g. 1 -> 2 -> 1)
  const recentPlayedIdsRef = useRef<string[]>([]);

  // Synchronized refs to eliminate stale closure bugs during continuous audio playback
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  const isShuffleRef = useRef<boolean>(isShuffle);
  const currentSongRef = useRef<Song | null>(currentSong);
  const songsRef = useRef<Song[]>(songs);
  const queueRef = useRef<Song[]>(queue);
  const historyRef = useRef<Song[]>(history);
  const blockedSongIdsRef = useRef<string[]>(blockedSongIds);
  const purchasedSongIdsRef = useRef<string[]>(purchasedSongIds);
  const activePlaylistSongsRef = useRef<Song[]>(activePlaylistSongs);
  const activePoolModeRef = useRef<'catalog' | 'album' | 'playlist'>('catalog');
  const exclusiveAlbumsRef = useRef<ExclusiveAlbum[]>(exclusiveAlbums);
  const handleSongEndRef = useRef<() => void>(() => {});

  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { isShuffleRef.current = isShuffle; }, [isShuffle]);
  useEffect(() => { currentSongRef.current = currentSong; }, [currentSong]);
  useEffect(() => { songsRef.current = songs; }, [songs]);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { historyRef.current = history; }, [history]);
  useEffect(() => { blockedSongIdsRef.current = blockedSongIds; }, [blockedSongIds]);
  useEffect(() => { purchasedSongIdsRef.current = purchasedSongIds; }, [purchasedSongIds]);
  useEffect(() => { activePlaylistSongsRef.current = activePlaylistSongs; }, [activePlaylistSongs]);
  useEffect(() => { exclusiveAlbumsRef.current = exclusiveAlbums; }, [exclusiveAlbums]);

  const updateSiteSettings = async (partial: Partial<SiteSettings>) => {
    const updated: SiteSettings = { ...siteSettings, ...partial };
    setSiteSettings(updated);
    await MusicService.saveSiteSettings(updated);
    if (updated.siteName) {
      document.title = `${updated.siteName} - ${updated.siteSlogan || ''}`;
    }
    if (updated.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        document.head.appendChild(link);
      }
      link.href = updated.faviconUrl;
    }
  };

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

  // Weekly Top Plays (Requirement 22)
  const [currentWeekKey] = useState<string>(() => {
    const d = new Date();
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${date.getUTCFullYear()}-W${weekNo}`;
  });

  const [weeklyPlays, setWeeklyPlays] = useState<Record<string, number>>(() => {
    try {
      const local = localStorage.getItem('xuanken_weekly');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && parsed.weekKey) {
          return parsed.songPlays || {};
        }
      }
    } catch (e) {}
    return {};
  });


  // Fetch weekly plays from Firebase
  useEffect(() => {
    MusicService.fetchWeeklyPlays(currentWeekKey).then((plays) => {
      if (plays && Object.keys(plays).length > 0) {
        setWeeklyPlays(plays);
      }
    });
  }, [currentWeekKey]);

  // Firebase Auth State Listener & Device Sync (Requirement 23)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setIsAuthLoading(true);
      if (fbUser) {
        // Fetch existing members and direct member doc by uid (so non-admins also get full data)
        const [allMembers, directMember, remoteLikedResult] = await Promise.all([
          MusicService.fetchMembers(),
          MusicService.fetchMemberByUid(fbUser.uid),
          MusicService.fetchLikedSongs(fbUser.uid),
        ]);
        let currentMember = allMembers.find((m) => m.uid === fbUser.uid || m.email === fbUser.email);
        if (directMember) {
          currentMember = currentMember
            ? {
                ...currentMember,
                ...directMember,
                purchasedSongIds: Array.from(new Set([...(currentMember.purchasedSongIds || []), ...(directMember.purchasedSongIds || [])])),
                likedSongIds: Array.from(new Set([...(currentMember.likedSongIds || []), ...(directMember.likedSongIds || [])])),
              }
            : directMember;
        }

        // Super Admin Check: Any email in PRIMARY_ADMIN_EMAILS has full admin privileges
        const userEmailClean = (fbUser.email || '').toLowerCase().trim();
        const isPrimaryAdmin = isSuperAdminEmail(userEmailClean);

        if (!currentMember) {
          const determinedRole: 'admin' | 'user' = isPrimaryAdmin ? 'admin' : 'user';
          let startingBal = siteSettings?.defaultStartingBalance ?? 500000;
          try {
            const localSaved = localStorage.getItem(`xuanken_member_balance_${fbUser.uid}`);
            if (localSaved !== null) {
              const num = parseInt(localSaved, 10);
              if (!isNaN(num)) startingBal = num;
            }
          } catch (e) {}
          currentMember = {
            uid: fbUser.uid,
            email: fbUser.email || 'user@xuanken.vn',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || (determinedRole === 'admin' ? 'Admin XuanKen' : 'Thành viên'),
            balance: startingBal,
            purchasedSongIds: [],
            likedSongIds: remoteLikedResult?.ids || [],
            blockedSongIds: [],
            role: determinedRole,
            createdAt: new Date().toLocaleDateString('vi-VN'),
          };
          const updated = [...allMembers, currentMember];
          setMembers(updated);
          await MusicService.upsertMember(currentMember);
        } else {
          if (isPrimaryAdmin && currentMember.role !== 'admin') {
            currentMember = {
              ...currentMember,
              role: 'admin',
              email: fbUser.email || currentMember.email,
            };
            await MusicService.upsertMember(currentMember);
          }
          // Restore any updated balance stored by admin
          try {
            const storedBal = localStorage.getItem(`xuanken_member_balance_${currentMember.uid}`);
            if (storedBal !== null) {
              const num = parseInt(storedBal, 10);
              if (!isNaN(num)) {
                currentMember.balance = num;
              }
            }
          } catch (e) {}
          const mergedList = allMembers.some((m) => m.uid === currentMember!.uid)
            ? allMembers.map((m) => (m.uid === currentMember!.uid ? currentMember! : m))
            : [...allMembers, currentMember];
          setMembers(mergedList);
        }

        // Restore user settings and states from Firebase (Requirement 23)
        const remoteLiked = Array.from(
          new Set([
            ...(Array.isArray(currentMember.likedSongIds) ? currentMember.likedSongIds : []),
            ...(remoteLikedResult?.ids || []),
          ])
        );
        const parseLocalLiked = (key: string): string[] => {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
          } catch (e) {
            return [];
          }
        };
        const uidLocal = parseLocalLiked(`xuanken_liked_${currentMember.uid}`);
        const v2Local = parseLocalLiked('xuanken_liked_v2');
        const guestLocal = parseLocalLiked('xuanken_liked_guest');

        let localTs = 0;
        try {
          const tsRaw = localStorage.getItem(`xuanken_liked_ts_${currentMember.uid}`);
          if (tsRaw) localTs = parseInt(tsRaw, 10) || 0;
        } catch (e) {}
        const remoteTs = remoteLikedResult?.updatedAt || 0;

        let mergedLikes: string[];
        if (remoteLikedResult && remoteTs > localTs && localTs > 0) {
          mergedLikes = Array.from(new Set([...remoteLiked, ...guestLocal]));
        } else {
          mergedLikes = Array.from(new Set([...remoteLiked, ...uidLocal, ...v2Local, ...guestLocal]));
        }

        currentMember = { ...currentMember, likedSongIds: mergedLikes };
        setCurrentUser(currentMember);
        setUserBalance(currentMember.balance);
        if (currentMember.purchasedSongIds) {
          setPurchasedSongIds(currentMember.purchasedSongIds);
          purchasedSongIdsRef.current = currentMember.purchasedSongIds;
        }
        if (currentMember.blockedSongIds) {
          setBlockedSongIds(currentMember.blockedSongIds);
        }
        setLikedSongIds(mergedLikes);
        try {
          localStorage.setItem(`xuanken_liked_${currentMember.uid}`, JSON.stringify(mergedLikes));
          localStorage.setItem('xuanken_liked_v2', JSON.stringify(mergedLikes));
          localStorage.setItem('xuanken_liked_guest', JSON.stringify(mergedLikes));
        } catch (e) {}
        if (mergedLikes.length !== remoteLiked.length || mergedLikes.some((id) => !remoteLiked.includes(id))) {
          MusicService.saveUserSettings(currentMember.uid, { likedSongIds: mergedLikes });
        }

        // Isolate playlists per user account (Requirement 3)
        try {
          const userPlStr = localStorage.getItem(`xuanken_playlists_${currentMember.uid}`);
          if (userPlStr) {
            setPlaylists(JSON.parse(userPlStr));
          } else {
            MusicService.fetchPlaylists().then((allPl) => {
              const userFiltered = (allPl || []).filter((p) => !p.userId || p.userId === currentMember!.uid);
              setPlaylists(userFiltered);
            });
          }
        } catch (e) {
          setPlaylists([]);
        }

        if (currentMember.theme) {
          setThemeState(currentMember.theme);
          try {
            localStorage.setItem('xuanken_theme', currentMember.theme);
          } catch (e) {}
        }
        if (currentMember.crossfadeDuration !== undefined) {
          setCrossfadeDurationState(currentMember.crossfadeDuration);
        }
        if (currentMember.preferredAudioFormat) {
          setPreferredAudioFormatState(currentMember.preferredAudioFormat);
        }
      } else {
        setCurrentUser(null);
        setUserBalance(0);
        setPurchasedSongIds([]);
        purchasedSongIdsRef.current = [];
        try {
          const parseKey = (k: string): string[] => {
            const raw = localStorage.getItem(k);
            if (!raw) return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
          };
          setLikedSongIds(Array.from(new Set([...parseKey('xuanken_liked_v2'), ...parseKey('xuanken_liked_guest')])));
        } catch (e) {
          setLikedSongIds([]);
        }
        setPlaylists([]);
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
    });

    // Real-time listener for live sync across devices
    const unsubscribeRealtime = MusicService.subscribeToSongs((updatedSongs) => {
      const list = updatedSongs || [];
      setSongs(list);
      setCurrentSong((cur) => {
        if (!cur) return null;
        // Never wipe out album songs or active playing tracks when standard catalog syncs
        if (cur.isAlbumTrack) return cur;
        const matched = list.find((s) => s.id === cur.id);
        return matched ? { ...cur, ...matched } : cur;
      });
    });

    if (currentUser?.role === 'admin') {
      MusicService.fetchMembers().then((loadedMembers) => {
        setMembers(loadedMembers || []);
      });
    }

    MusicService.fetchPlaylists().then((loadedPlaylists) => {
      if (currentUser?.uid) {
        const userFiltered = (loadedPlaylists || []).filter((p) => !p.userId || p.userId === currentUser.uid);
        setPlaylists(userFiltered);
      }
    });

    MusicService.fetchVouchers().then((loadedVouchers) => {
      setVouchers(loadedVouchers || []);
    });

    MusicService.fetchAudioSettings(currentUser?.uid).then((settings) => {
      if (settings) {
        if (settings.preferredFormat) {
          setPreferredAudioFormatState(settings.preferredFormat);
        }
        if (settings.formatMap && Object.keys(settings.formatMap).length > 0) {
          setSongFormatMap(settings.formatMap);
        }
        if (settings.crossfadeDuration !== undefined) {
          setCrossfadeDurationState(settings.crossfadeDuration);
          audioEngine.setCrossfadeDuration(settings.crossfadeDuration);
          try {
            localStorage.setItem('xuanken_crossfade_duration', settings.crossfadeDuration.toString());
          } catch (e) {}
        }
      }
    });

    MusicService.fetchSiteSettings().then((loaded) => {
      if (loaded) {
        setSiteSettings((prev) => {
          const merged = { ...prev, ...loaded };
          if (merged.siteName) {
            document.title = `${merged.siteName} - ${merged.siteSlogan || ''}`;
          }
          if (merged.faviconUrl) {
            let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
            if (!link) {
              link = document.createElement('link');
              link.type = 'image/x-icon';
              link.rel = 'shortcut icon';
              document.head.appendChild(link);
            }
            link.href = merged.faviconUrl;
          }
          return merged;
        });
      }
    });

    MusicService.fetchExclusiveAlbums().then((loadedAlbums) => {
      const list = loadedAlbums || [];
      setExclusiveAlbums(list);
      exclusiveAlbumsRef.current = list;
    });
    const unsubscribeAlbums = MusicService.subscribeToExclusiveAlbums((updatedAlbums) => {
      const list = updatedAlbums || [];
      setExclusiveAlbums(list);
      exclusiveAlbumsRef.current = list;
      setSelectedAlbum((prev) => {
        if (!prev) return null;
        const matched = list.find((a) => a.id === prev.id);
        return matched || prev;
      });
      setCurrentSong((cur) => {
        if (!cur || !cur.isAlbumTrack) return cur;
        const alb = list.find((a) => a.id === cur.albumId);
        if (alb && alb.songs) {
          const matchedSong = alb.songs.find((s) => s.id === cur.id);
          if (matchedSong) {
            return {
              ...cur,
              title: matchedSong.title || cur.title,
              artists: matchedSong.artists || cur.artists,
              playCount: matchedSong.playCount ?? cur.playCount,
              plays: `${(matchedSong.playCount || 0).toLocaleString('vi-VN')} lượt nghe`,
            };
          }
        }
        return cur;
      });
    });

    MusicService.fetchChatMessages().then((loadedMsgs) => {
      setChatMessages(loadedMsgs || []);
    });
    const unsubscribeChat = MusicService.subscribeToChatMessages((updatedMsgs) => {
      setChatMessages(updatedMsgs || []);
    });

    MusicService.fetchArtistBios().then((loadedBios) => {
      setArtistBios(loadedBios || []);
    });

    return () => {
      unsubscribeRealtime();
      unsubscribeAlbums();
      unsubscribeChat();
    };
  }, []);
  const isSongPurchased = (songId: string): boolean => {
    // Current song is album track -> always full quality and free to play
    if (currentSongRef.current?.id === songId && currentSongRef.current?.isAlbumTrack) {
      return true;
    }
    // Album tracks inside exclusive albums are full quality and free to play for everyone
    const albumsPool = exclusiveAlbumsRef.current.length > 0 ? exclusiveAlbumsRef.current : exclusiveAlbums;
    if (albumsPool.some((a) => (a.songs || []).some((s) => s.id === songId || (s as any)._id === songId))) {
      return true;
    }
    return purchasedSongIdsRef.current.includes(songId) || purchasedSongIds.includes(songId);
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
    try {
      const guestLiked =
        localStorage.getItem('xuanken_liked_v2') ||
        localStorage.getItem('xuanken_liked_guest');
      setLikedSongIds(guestLiked ? JSON.parse(guestLiked) : []);
    } catch (e) {
      setLikedSongIds([]);
    }
    setPlaylists([]);
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

  const isAdmin = Boolean(
    currentUser?.role === 'admin' ||
    isSuperAdminEmail(currentUser?.email) ||
    (auth.currentUser?.email && isSuperAdminEmail(auth.currentUser.email))
  );

  const resolveAudioUrl = (song: Song | null | undefined, format: 'MP3' | 'WAV', purchased?: boolean) => {
    if (!song) return '';
    const isActuallyPurchased = purchased || song.isPurchased || isSongPurchased(song.id);
    let url = '';
    // Security Restriction: If song is NOT purchased and user is NOT admin,
    // ONLY the 60-second demo URL is provided. Full lossless master links are protected.
    if (!isActuallyPurchased && !isAdmin) {
      url = song.demoUrl || song.mp3Url || '';
    } else {
      const wantsWav = format === 'WAV' || song.audioFormat === 'WAV';
      url = wantsWav
        ? (song.wavUrl || song.mp3Url || song.demoUrl || '')
        : (song.mp3Url || song.wavUrl || song.demoUrl || '');
    }
    // Fallback if URL contains obsolete 404 demo1/demo2/demo3 links or is empty
    if (!url || url.includes('/demo1.mp3') || url.includes('/demo2.mp3') || url.includes('/demo3.mp3')) {
      return 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/musicofficial/BANTINHCADAUTIEN-XUANKEN.mp3';
    }
    return url;
  };

  const setPreferredAudioFormat = (fmt: 'MP3' | 'WAV') => {
    setPreferredAudioFormatState(fmt);
    MusicService.saveAudioSettings(fmt, songFormatMap, currentUser?.uid, crossfadeDuration);
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

  // All Searchable Songs across standard songs catalog and curated albums (Requirement 3)
  const allSearchableSongs: Song[] = [
    ...songs,
    ...exclusiveAlbums.flatMap((album) =>
      (album.songs || []).map((s, idx) => ({
        id: s.id,
        stt: s.stt || idx + 1,
        title: s.title,
        artists: s.artists,
        duration: s.duration || 210,
        audioFormat: 'MP3' as const,
        coverImage: s.coverImage || album.coverImage,
        coverGradient: 'from-purple-900 to-indigo-950',
        album: album.title,
        price: 0,
        isPurchased: true,
        demoUrl: s.demoUrl || s.mp3Url || s.wavUrl,
        mp3Url: s.mp3Url,
        wavUrl: s.wavUrl,
        lyrics: s.lyrics || [],
        lrcRaw: s.lrcRaw,
        plays: `${(s.playCount || 0).toLocaleString('vi-VN')} lượt nghe`,
        playCount: s.playCount || 0,
        isAlbumTrack: true,
        albumId: album.id,
      }))
    ),
  ];

  // Screen WakeLock & Background Playback Recovery (Requirement 1)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const realTime = audioEngine.getCurrentTime();
        if (realTime >= 0) {
          setCurrentTime(realTime);
        }
        if (isPlaying) {
          audioEngine.acquireWakeLock();
          if (audioEngine.isAudioPaused()) {
            audioEngine.resume().catch(() => {});
          }
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isPlaying]);

  // Audio Playback & Duration resolution
  useEffect(() => {
    if (!isPlaying) {
      if (!audioEngine.isAudioPaused()) {
        audioEngine.pause();
      }
      return;
    }

    if (isPlaying && currentSong) {
      const activePurchased = isSongPurchased(currentSong.id);
      const songFormat = songFormatMap[currentSong.id] || preferredAudioFormat;
      const activeUrl = resolveAudioUrl(currentSong, songFormat, activePurchased);

      if (audioEngine.getCurrentUrl() !== activeUrl) {
        audioEngine.playUrl(activeUrl, (dur) => {
          if (dur > 0) {
            setDuration(dur);
          }
        });
      } else if (audioEngine.isAudioPaused()) {
        audioEngine.resume().catch(() => {});
      }
    }
  }, [isPlaying, currentSong?.id, preferredAudioFormat, songFormatMap, purchasedSongIds]);

  // Playback timer & 60-second Demo cutoff
  useEffect(() => {
    if (isPlaying && currentSong) {
      timerRef.current = window.setInterval(() => {
        const audioEngineTime = audioEngine.getCurrentTime();
        const isAudioPaused = audioEngine.isAudioPaused();

        // If audio element is paused in background or locked screen, don't run timer ahead artificially
        if (isAudioPaused) {
          return;
        }

        const purchased = isSongPurchased(currentSong.id);
        const nextTime = audioEngineTime >= 0 ? audioEngineTime : 0;

        // Requirement 2 & 6: Demo 60s limitation - at yellow dot, pop up buy song modal
        // NEVER cut off album tracks (album tracks are 100% free for everyone)
        if (!currentSong.isAlbumTrack && !purchased && nextTime >= 60) {
          audioEngine.pause();
          setIsPlaying(false);
          setSongToBuy(currentSong);
          setIsBuyModalOpen(true);
          setIsDemoLimitModalOpen(true);
          setCurrentTime(60);
          return;
        }

        // Requirement 9: Only end song when audio has actually ended!
        if (audioEngine.isEnded()) {
          handleSongEndRef.current();
          return;
        }

        audioEngine.updatePositionState(nextTime, duration, playbackRate);

        // Requirement 8: Phải nghe đủ 5 giây trở lên mới tính là 1 lượt nghe
        const minSeconds = siteSettings?.minListenDurationSeconds ?? 5;
        if (!hasCountedPlayRef.current && nextTime >= minSeconds && currentSong) {
          hasCountedPlayRef.current = true;

          if (currentSong.isAlbumTrack && currentSong.albumId) {
            setExclusiveAlbums((prevAlbums) => {
              const updated = prevAlbums.map((alb) => {
                if (alb.id !== currentSong.albumId) return alb;
                return {
                  ...alb,
                  songs: (alb.songs || []).map((s) =>
                    s.id === currentSong.id ? { ...s, playCount: (s.playCount || 0) + 1 } : s
                  ),
                };
              });
              exclusiveAlbumsRef.current = updated;
              MusicService.saveExclusiveAlbums(updated);
              return updated;
            });
            setCurrentSong((prev) => (prev && prev.id === currentSong.id ? { ...prev, playCount: (prev.playCount || 0) + 1 } : prev));
          } else {
            // Increment playCount for #xuankenchart ranking and sync to Firebase
            setSongs((prevSongs) => {
              const target = prevSongs.find((s) => s.id === currentSong.id);
              const nextPlayCount = ((target?.playCount || currentSong.playCount || 0) + 1);
              MusicService.incrementPlayCount(currentSong.id, nextPlayCount);
              return prevSongs.map((s) => (s.id === currentSong.id ? { ...s, playCount: nextPlayCount } : s));
            });
            setCurrentSong((prev) => (prev && prev.id === currentSong.id ? { ...prev, playCount: (prev.playCount || 0) + 1 } : prev));

            // Update Weekly Plays
            setWeeklyPlays((prevWeekly) => {
              const updated = {
                ...prevWeekly,
                [currentSong.id]: (prevWeekly[currentSong.id] || 0) + 1,
              };
              MusicService.saveWeeklyPlays(currentWeekKey, updated);
              return updated;
            });
          }
        }

        setCurrentTime(nextTime);
      }, 100);
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
  }, [isPlaying, currentSong?.id, duration, playbackRate, siteSettings, currentWeekKey]);

  useEffect(() => {
    handleSongEndRef.current = handleSongEnd;
  });

  // Register AudioEngine ended listener to seamlessly play next/repeat track
  useEffect(() => {
    audioEngine.setOnEnded(() => {
      handleSongEndRef.current();
    });
    return () => {
      audioEngine.setOnEnded(null);
    };
  }, []);

  // Helper to pick a non-repeating random song from a candidate pool
  const pickNonRepeatingRandom = (pool: Song[], currentSongId?: string): Song | null => {
    if (!pool || pool.length === 0) return null;
    if (pool.length === 1) return pool[0];

    // Exclude current song
    let candidates = pool.filter((s) => s.id !== currentSongId);
    if (candidates.length === 0) candidates = pool;

    // Avoid recently played songs (up to 70% of pool size, max 20, min 1)
    const avoidCount = Math.min(candidates.length - 1, Math.max(1, Math.floor(pool.length * 0.7)));
    const recentToAvoid = new Set(recentPlayedIdsRef.current.slice(0, avoidCount));

    const filteredCandidates = candidates.filter((s) => !recentToAvoid.has(s.id));
    const finalPool = filteredCandidates.length > 0 ? filteredCandidates : candidates;

    const randomIndex = Math.floor(Math.random() * finalPool.length);
    return finalPool[randomIndex];
  };

  // Helper to pick random song from active pool (supports playlist and main library)
  const getRandomSong = (excludeCurrent: boolean = true): Song | null => {
    const blocked = blockedSongIdsRef.current;
    const poolSource = activePlaylistSongsRef.current.length > 0 ? activePlaylistSongsRef.current : songsRef.current;
    const activePool = poolSource.filter((s) => !blocked.includes(s.id));
    if (activePool.length === 0) return null;

    const current = currentSongRef.current;
    return pickNonRepeatingRandom(activePool, excludeCurrent && current ? current.id : undefined);
  };

  const handleSongEnd = () => {
    const now = Date.now();
    // Guard against duplicate triggers within 600ms
    if (now - lastEndedTimestampRef.current < 600) return;
    lastEndedTimestampRef.current = now;

    const currentRepMode = repeatModeRef.current;
    const currentSongItem = currentSongRef.current;
    const isShuffleActive = isShuffleRef.current;
    const blocked = blockedSongIdsRef.current;

    // 1: Lặp lại 1 bài (Repeat 1) -> Tự động phát lại chính bài này từ đầu (0:00)
    // Sửa lỗi: không bao giờ chạy bài khác và không bao giờ đứng yên
    if (currentRepMode === 'one' && currentSongItem) {
      setCurrentTime(0);
      seekTo(0);
      playSong(currentSongItem, undefined, true);
      return;
    }

    // Requirement 6: If current song is an album track AND we are NOT playing inside a personal playlist/custom pool,
    // stay strictly inside this album!
    if (activePoolModeRef.current !== 'playlist' && currentSongItem?.isAlbumTrack && currentSongItem.albumId) {
      const album = (exclusiveAlbumsRef.current.length > 0 ? exclusiveAlbumsRef.current : exclusiveAlbums).find((a) => a.id === currentSongItem.albumId);
      const isNhacTre =
        album?.title?.toLowerCase().includes('nhạc trẻ') ||
        (album?.genre && album?.genre?.toLowerCase().includes('nhạc trẻ')) ||
        album?.title?.toLowerCase().includes('tuyển tập');
      const rawSongs = album?.songs || [];
      const sortedSongs = isNhacTre
        ? [...rawSongs].sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' }))
        : rawSongs;
      const albumSongs = activePlaylistSongsRef.current.length > 0 && activePlaylistSongsRef.current.every((s) => s.albumId === currentSongItem.albumId)
        ? activePlaylistSongsRef.current
        : sortedSongs.map((s, idx) => ({ ...s, isAlbumTrack: true, albumId: album?.id, album: album?.title, price: 0, isPurchased: true, audioFormat: 'MP3' as const, coverImage: s.coverImage || album?.coverImage, duration: s.duration || 210, stt: idx + 1 } as Song));

      if (albumSongs.length > 0) {
        activePlaylistSongsRef.current = albumSongs;

        if (currentRepMode === 'one') {
          setCurrentTime(0);
          seekTo(0);
          playSong(currentSongItem, undefined, true);
          return;
        }

        if (isShuffleActive) {
          const chosen = pickNonRepeatingRandom(albumSongs, currentSongItem.id) || albumSongs[0];
          playSong(chosen);
          return;
        }

        const curIdx = albumSongs.findIndex((s) => s.id === currentSongItem.id);
        if (curIdx !== -1 && curIdx + 1 < albumSongs.length) {
          playSong(albumSongs[curIdx + 1]);
          return;
        }

        if (currentRepMode === 'all') {
          playSong(albumSongs[0]);
          return;
        }

        setIsPlaying(false);
        seekTo(0);
        return;
      }
    }

    const poolSource = activePlaylistSongsRef.current.length > 0 ? activePlaylistSongsRef.current : songsRef.current;
    const activePool = poolSource.filter((s) => !blocked.includes(s.id));

    if (activePool.length === 0) {
      setIsPlaying(false);
      return;
    }

    // 2: Phát ngẫu nhiên (Shuffle) -> Chọn ngẫu nhiên bài tiếp theo trong pool hiện tại (không dừng sau 1 bài)
    if (isShuffleActive) {
      const nextRandom = getRandomSong(true);
      if (nextRandom) {
        playSong(nextRandom);
        return;
      }
    }

    // 3: Phát từ hàng đợi (Queue) nếu có
    const unblockedQueue = queueRef.current.filter((s) => !blocked.includes(s.id));
    if (unblockedQueue.length > 0) {
      const next = unblockedQueue[0];
      setQueue((q) => q.filter((s) => s.id !== next.id));
      playSong(next);
      return;
    }

    // 4: Phát tiếp tục bài kế tiếp trong active pool
    const curIdx = currentSongItem ? activePool.findIndex((s) => s.id === currentSongItem.id) : -1;
    if (curIdx !== -1 && curIdx + 1 < activePool.length) {
      playSong(activePool[curIdx + 1]);
      return;
    }

    // 5: Hết bài trong playlist/danh sách -> Nếu bật Lặp lại tất cả ('all') thì quay lại đầu
    if (currentRepMode === 'all') {
      playSong(activePool[0]);
      return;
    }

    // 6: Tắt lặp lại ('off') và đã hết bài -> Dừng phát
    setIsPlaying(false);
    seekTo(0);
  };

  const playSong = (song: Song, formatOverride?: 'MP3' | 'WAV', forceRestart: boolean = false) => {
    if (formatOverride) {
      setSongFormatMap((prev) => ({ ...prev, [song.id]: formatOverride }));
    }

    const isStayingInPlaylistPool =
      activePoolModeRef.current === 'playlist' &&
      activePlaylistSongsRef.current.length > 0 &&
      activePlaylistSongsRef.current.some((s) => s.id === song.id);

    // Ensure active playlist is properly set when playing an album track directly (unless playing inside a mixed personal playlist)
    if (!isStayingInPlaylistPool && song.isAlbumTrack && song.albumId) {
      activePoolModeRef.current = 'album';
      if (
        activePlaylistSongsRef.current.length === 0 ||
        !activePlaylistSongsRef.current.every((s) => s.albumId === song.albumId) ||
        !activePlaylistSongsRef.current.some((s) => s.id === song.id)
      ) {
        const matchedAlbum = (exclusiveAlbumsRef.current.length > 0 ? exclusiveAlbumsRef.current : exclusiveAlbums).find((a) => a.id === song.albumId);
        if (matchedAlbum && Array.isArray(matchedAlbum.songs) && matchedAlbum.songs.length > 0) {
          const rawList = matchedAlbum.songs;
          const isNhacTre =
            matchedAlbum.title?.toLowerCase().includes('nhạc trẻ') ||
            (matchedAlbum.genre && matchedAlbum.genre?.toLowerCase().includes('nhạc trẻ')) ||
            matchedAlbum.title?.toLowerCase().includes('tuyển tập');
          const sortedList = isNhacTre
            ? [...rawList].sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' }))
            : rawList;
          const albumAsSongs: Song[] = sortedList.map((s, idx) => ({
            id: s.id,
            stt: s.stt || idx + 1,
            title: s.title,
            artists: s.artists || matchedAlbum.artist || 'XuanKen Official',
            duration: s.duration && s.duration > 0 ? s.duration : 210,
            audioFormat: s.audioFormat || 'MP3',
            coverImage: s.coverImage || matchedAlbum.coverImage,
            coverGradient: 'from-purple-900 to-indigo-950',
            album: matchedAlbum.title,
            price: 0,
            isPurchased: true,
            demoUrl: s.demoUrl || s.mp3Url || s.wavUrl,
            mp3Url: s.mp3Url,
            wavUrl: s.wavUrl,
            lyrics: s.lyrics || [],
            lrcRaw: s.lrcRaw,
            plays: `${(s.playCount || 0).toLocaleString('vi-VN')} lượt nghe`,
            playCount: s.playCount || 0,
            isAlbumTrack: true,
            albumId: matchedAlbum.id,
          }));
          setActivePlaylistSongs(albumAsSongs);
          activePlaylistSongsRef.current = albumAsSongs;
        }
      }
    } else if (!isStayingInPlaylistPool && activePlaylistSongsRef.current.length > 0) {
      activePoolModeRef.current = 'catalog';
      setActivePlaylistSongs([]);
      activePlaylistSongsRef.current = [];
    } else if (!isStayingInPlaylistPool) {
      activePoolModeRef.current = 'catalog';
    }

    // Reset 5s playback counter for this play session
    hasCountedPlayRef.current = false;

    if (currentSong?.id !== song.id || forceRestart) {
      if (currentSong && currentSong.id !== song.id) {
        setHistory((prev) => [currentSong, ...prev.filter((s) => s.id !== currentSong.id)]);
      }
      setCurrentSong(song);
      currentSongRef.current = song;
      setCurrentTime(0);
      setDuration(song.duration && song.duration > 0 ? song.duration : 210);
    } else {
      setCurrentSong(song);
      currentSongRef.current = song;
    }
    setIsPlaying(true);

    // Track recently played song ID for non-repeating shuffle
    recentPlayedIdsRef.current = [song.id, ...recentPlayedIdsRef.current.filter((id) => id !== song.id)].slice(0, 50);

    const activePurchased = isSongPurchased(song.id);
    const chosenFormat = formatOverride || songFormatMap[song.id] || preferredAudioFormat;
    const activeUrl = resolveAudioUrl(song, chosenFormat, activePurchased);

    audioEngine.playUrl(
      activeUrl,
      (dur) => {
        if (dur > 0) {
          setDuration(dur);
        }
      },
      forceRestart
    );
  };

  const togglePlay = () => {
    if (!currentSong && songs.length > 0) {
      const unblocked = songs.filter((s) => !blockedSongIds.includes(s.id));
      if (unblocked.length > 0) {
        playSong(unblocked[0]);
      }
      return;
    }
    if (isPlaying) {
      setIsPlaying(false);
      audioEngine.pause();
    } else {
      setIsPlaying(true);
      if (audioEngine.isAudioPaused() && audioEngine.getCurrentUrl()) {
        audioEngine.resume().catch(() => {});
      } else if (currentSong) {
        playSong(currentSong);
      }
    }
  };

  const seekTo = (seconds: number) => {
    if (!currentSong) return;
    const purchased = isSongPurchased(currentSong.id);
    if (!currentSong.isAlbumTrack && !purchased && seconds >= 60) {
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
    const isShuffleActive = isShuffleRef.current;
    const blocked = blockedSongIdsRef.current;
    const currentSongItem = currentSongRef.current;

    // Requirement 6: If current song is an album track AND NOT inside a personal playlist/custom pool, stay strictly inside this album!
    if (activePoolModeRef.current !== 'playlist' && currentSongItem?.isAlbumTrack && currentSongItem.albumId) {
      const album = (exclusiveAlbumsRef.current.length > 0 ? exclusiveAlbumsRef.current : exclusiveAlbums).find((a) => a.id === currentSongItem.albumId);
      const isNhacTre =
        album?.title?.toLowerCase().includes('nhạc trẻ') ||
        (album?.genre && album?.genre?.toLowerCase().includes('nhạc trẻ')) ||
        album?.title?.toLowerCase().includes('tuyển tập');
      const rawSongs = album?.songs || [];
      const sortedSongs = isNhacTre
        ? [...rawSongs].sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' }))
        : rawSongs;
      const albumSongs = activePlaylistSongsRef.current.length > 0 && activePlaylistSongsRef.current.every((s) => s.albumId === currentSongItem.albumId)
        ? activePlaylistSongsRef.current
        : sortedSongs.map((s, idx) => ({ ...s, isAlbumTrack: true, albumId: album?.id, album: album?.title, price: 0, isPurchased: true, audioFormat: 'MP3' as const, coverImage: s.coverImage || album?.coverImage, duration: s.duration || 210, stt: idx + 1 } as Song));

      if (albumSongs.length > 0) {
        activePlaylistSongsRef.current = albumSongs;

        if (isShuffleActive) {
          const chosen = pickNonRepeatingRandom(albumSongs, currentSongItem.id) || albumSongs[0];
          playSong(chosen);
          return;
        }

        const curIdx = albumSongs.findIndex((s) => s.id === currentSongItem.id);
        const nextIdx = curIdx !== -1 && curIdx + 1 < albumSongs.length ? curIdx + 1 : 0;
        playSong(albumSongs[nextIdx]);
        return;
      }
    }

    const poolSource = activePlaylistSongsRef.current.length > 0 ? activePlaylistSongsRef.current : songsRef.current;
    const activePool = poolSource.filter((s) => !blocked.includes(s.id));

    if (activePool.length === 0) {
      setIsPlaying(false);
      return;
    }

    // 1: Bật ngẫu nhiên -> Random bài tiếp theo trong active pool
    if (isShuffleActive) {
      const nextRandom = getRandomSong(true);
      if (nextRandom) {
        playSong(nextRandom);
        return;
      }
    }

    // 2: Có bài trong hàng đợi
    const unblockedQueue = queueRef.current.filter((s) => !blocked.includes(s.id));
    if (unblockedQueue.length > 0) {
      const next = unblockedQueue[0];
      setQueue((q) => q.filter((s) => s.id !== next.id));
      playSong(next);
      return;
    }

    // 3: Tiếp tục bài kế tiếp trong active pool
    const curIdx = currentSongItem ? activePool.findIndex((s) => s.id === currentSongItem.id) : -1;
    if (curIdx !== -1 && curIdx + 1 < activePool.length) {
      playSong(activePool[curIdx + 1]);
      return;
    }

    // 4: Đã ở cuối danh sách -> Quay lại bài đầu tiên
    playSong(activePool[0]);
  };

  const prevSong = () => {
    // Sửa lại cho logic lùi bài bình thường và lùi bài khi bật ngẫu nhiên (KHÔNG tua về đầu bài hiện tại)
    const isShuffleActive = isShuffleRef.current;
    const blocked = blockedSongIdsRef.current;
    const currentSongItem = currentSongRef.current;

    // Requirement 6: If current song is an album track AND NOT inside a personal playlist/custom pool, stay strictly inside this album!
    if (activePoolModeRef.current !== 'playlist' && currentSongItem?.isAlbumTrack && currentSongItem.albumId) {
      const album = (exclusiveAlbumsRef.current.length > 0 ? exclusiveAlbumsRef.current : exclusiveAlbums).find((a) => a.id === currentSongItem.albumId);
      const isNhacTre =
        album?.title?.toLowerCase().includes('nhạc trẻ') ||
        (album?.genre && album?.genre?.toLowerCase().includes('nhạc trẻ')) ||
        album?.title?.toLowerCase().includes('tuyển tập');
      const rawSongs = album?.songs || [];
      const sortedSongs = isNhacTre
        ? [...rawSongs].sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' }))
        : rawSongs;
      const albumSongs = activePlaylistSongsRef.current.length > 0 && activePlaylistSongsRef.current.every((s) => s.albumId === currentSongItem.albumId)
        ? activePlaylistSongsRef.current
        : sortedSongs.map((s, idx) => ({ ...s, isAlbumTrack: true, albumId: album?.id, album: album?.title, price: 0, isPurchased: true, audioFormat: 'MP3' as const, coverImage: s.coverImage || album?.coverImage, duration: s.duration || 210, stt: idx + 1 } as Song));

      if (albumSongs.length > 0) {
        activePlaylistSongsRef.current = albumSongs;

        if (isShuffleActive) {
          const unblockedHistory = historyRef.current.filter((s) => !blocked.includes(s.id) && s.albumId === currentSongItem.albumId);
          if (unblockedHistory.length > 0) {
            playSong(unblockedHistory[0]);
            return;
          }
          const chosen = pickNonRepeatingRandom(albumSongs, currentSongItem.id) || albumSongs[0];
          playSong(chosen);
          return;
        }

        const curIdx = albumSongs.findIndex((s) => s.id === currentSongItem.id);
        const prevIdx = curIdx > 0 ? curIdx - 1 : albumSongs.length - 1;
        playSong(albumSongs[prevIdx]);
        return;
      }
    }
    const poolSource = activePlaylistSongsRef.current.length > 0 ? activePlaylistSongsRef.current : songsRef.current;
    const activePool = poolSource.filter((s) => !blocked.includes(s.id));

    if (activePool.length === 0) return;

    // 1: Khi bật Random -> Lùi về bài vừa nghe gần nhất trong lịch sử, nếu lịch sử trống thì random bài khác
    if (isShuffleActive) {
      const unblockedHistory = historyRef.current.filter((s) => !blocked.includes(s.id));
      if (unblockedHistory.length > 0) {
        const prev = unblockedHistory[0];
        setHistory((h) => h.filter((s) => s.id !== prev.id));
        if (currentSongItem) setQueue((q) => [currentSongItem, ...q.filter((s) => s.id !== currentSongItem.id)]);
        playSong(prev);
        return;
      }
      const prevRandom = getRandomSong(true);
      if (prevRandom) {
        playSong(prevRandom);
        return;
      }
    }

    // 2: Lùi bình thường: Nếu có bài vừa nghe trong lịch sử
    const unblockedHistory = historyRef.current.filter((s) => !blocked.includes(s.id));
    if (unblockedHistory.length > 0) {
      const prev = unblockedHistory[0];
      setHistory((h) => h.filter((s) => s.id !== prev.id));
      if (currentSongItem) setQueue((q) => [currentSongItem, ...q.filter((s) => s.id !== currentSongItem.id)]);
      playSong(prev);
      return;
    }

    // 3: Lùi bài trong danh sách hiện tại (danh sách bài hát hoặc playlist cá nhân)
    const curIdx = currentSongItem ? activePool.findIndex((s) => s.id === currentSongItem.id) : -1;
    if (curIdx > 0) {
      playSong(activePool[curIdx - 1]);
      return;
    } else if (curIdx <= 0) {
      // Đang ở bài đầu tiên: lùi sẽ quay về bài cuối cùng của danh sách
      playSong(activePool[activePool.length - 1]);
      return;
    }

    seekTo(0);
  };

  const toggleLike = (songId: string) => {
    setLikedSongIds((prev) => {
      const isCurrentlyLiked = prev.includes(songId);
      const next = isCurrentlyLiked ? prev.filter((id) => id !== songId) : [...prev, songId];
      try {
        localStorage.setItem('xuanken_liked_v2', JSON.stringify(next));
        localStorage.setItem('xuanken_liked_guest', JSON.stringify(next));
        if (currentUser?.uid) {
          localStorage.setItem(`xuanken_liked_${currentUser.uid}`, JSON.stringify(next));
          localStorage.setItem(`xuanken_liked_ts_${currentUser.uid}`, Date.now().toString());
        }
      } catch (e) {}
      if (currentUser?.uid) {
        setCurrentUser((cur) => (cur ? { ...cur, likedSongIds: next } : cur));
        setMembers((prevMembers) =>
          prevMembers.map((m) => (m.uid === currentUser.uid ? { ...m, likedSongIds: next } : m))
        );
        MusicService.saveUserSettings(currentUser.uid, { likedSongIds: next });
      }

      // Cập nhật lượt tim theo thời gian thực trên cả danh sách songs và currentSong
      setSongs((prevSongs) =>
        prevSongs.map((s) => {
          if (s.id === songId) {
            const curLikes = s.likesCount ?? 0;
            const updatedLikes = isCurrentlyLiked ? Math.max(0, curLikes - 1) : curLikes + 1;
            return { ...s, likesCount: updatedLikes };
          }
          return s;
        })
      );

      setCurrentSong((cur) => {
        if (cur && cur.id === songId) {
          const curLikes = cur.likesCount ?? 0;
          const updatedLikes = isCurrentlyLiked ? Math.max(0, curLikes - 1) : curLikes + 1;
          return { ...cur, likesCount: updatedLikes };
        }
        return cur;
      });

      return next;
    });
  };

  const blockSong = (songId: string) => {
    setBlockedSongIds((prev) => {
      const next = prev.includes(songId) ? prev : [...prev, songId];
      try {
        localStorage.setItem('xuanken_blocked_songs', JSON.stringify(next));
      } catch (e) {}
      if (currentUser?.uid) {
        MusicService.saveUserSettings(currentUser.uid, { blockedSongIds: next });
      }
      return next;
    });
    if (currentSong?.id === songId) {
      nextSong();
    }
  };

  const unblockSong = (songId: string) => {
    setBlockedSongIds((prev) => {
      const next = prev.filter((id) => id !== songId);
      try {
        localStorage.setItem('xuanken_blocked_songs', JSON.stringify(next));
      } catch (e) {}
      if (currentUser?.uid) {
        MusicService.saveUserSettings(currentUser.uid, { blockedSongIds: next });
      }
      return next;
    });
  };

  const isSongBlocked = (songId: string): boolean => {
    return blockedSongIds.includes(songId);
  };

  const reportSongIssue = async (songId: string, issue: string): Promise<{ success: boolean; message: string }> => {
    await MusicService.saveSongReport(songId, issue, currentUser?.email || 'Khách vãng lai');
    return { success: true, message: 'Đã gửi báo cáo lỗi thành công!' };
  };

  const toggleShuffle = () => {
    setIsShuffle((prev) => {
      const next = !prev;
      isShuffleRef.current = next;
      const poolSource = activePlaylistSongsRef.current.length > 0 ? activePlaylistSongsRef.current : songsRef.current;
      const blocked = blockedSongIdsRef.current;
      const unblocked = poolSource.filter((s) => !blocked.includes(s.id));

      if (next && unblocked.length > 0) {
        const remaining = unblocked.filter((s) => s.id !== currentSongRef.current?.id);
        const shuffled = [...remaining].sort(() => Math.random() - 0.5);
        setQueue(shuffled);
      } else if (!next && unblocked.length > 0) {
        const currentItem = currentSongRef.current;
        const curIdx = currentItem ? unblocked.findIndex((s) => s.id === currentItem.id) : -1;
        if (curIdx !== -1) {
          const ordered = [...unblocked.slice(curIdx + 1), ...unblocked.slice(0, curIdx)];
          setQueue(ordered);
        } else {
          setQueue(unblocked.slice(1));
        }
      }
      return next;
    });
  };

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
      const rootEl = document.getElementById('root');
      if (rootEl) rootEl.setAttribute('data-theme', t);
      localStorage.setItem('xuanken_theme', t);
    } catch (e) {}
    if (currentUser?.uid) {
      MusicService.saveUserSettings(currentUser.uid, { theme: t });
    }
  };

  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
      const rootEl = document.getElementById('root');
      if (rootEl) rootEl.setAttribute('data-theme', theme);
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

  const setSleepTimerSeconds = (seconds: number | null) => {
    if (seconds === null || seconds <= 0) {
      setSleepTimerMinutes(null);
      setSleepTimerRemainingSeconds(null);
    } else {
      setSleepTimerMinutes(Math.ceil(seconds / 60));
      setSleepTimerRemainingSeconds(seconds);
    }
  };

  // Active countdown timer effect for Sleep Timer
  useEffect(() => {
    if (sleepTimerRemainingSeconds !== null && sleepTimerRemainingSeconds > 0) {
      const interval = window.setInterval(() => {
        setSleepTimerRemainingSeconds((prev) => {
          if (prev === null || prev <= 1) {
            audioEngine.pause();
            setIsPlaying(false);
            setSleepTimerMinutes(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sleepTimerRemainingSeconds !== null && sleepTimerRemainingSeconds > 0]);

  const addToQueue = (song: Song) => {
    setQueue((prev) => (prev.some((s) => s.id === song.id) ? prev : [...prev, song]));
  };

  const removeFromQueue = (songId: string) => {
    setQueue((prev) => prev.filter((s) => s.id !== songId));
  };

  const clearQueue = () => setQueue([]);

  // Store Buy Song
  const buySong = (song: Song, priceOverride?: number, voucherCodeApplied?: string): { success: boolean; message: string } => {
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
      const updatedUsedCodes = voucherCodeApplied
        ? Array.from(new Set([...(currentUser.usedVoucherCodes || []), voucherCodeApplied.trim().toUpperCase()]))
        : (currentUser.usedVoucherCodes || []);

      const updatedUser: AppUser = {
        ...currentUser,
        balance: newBalance,
        purchasedSongIds: newPurchased,
        usedVoucherCodes: updatedUsedCodes,
      };
      setCurrentUser(updatedUser);
      MusicService.upsertMember(updatedUser);

      // Record audit purchase log
      MusicService.recordPurchase({
        id: `pur-${Date.now()}`,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        songId: song.id,
        songTitle: song.title,
        price: priceToPay,
        timestamp: new Date().toISOString(),
      });
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
    return await MusicService.syncAllToFirebase(songs, members, playlists, vouchers, exclusiveAlbums);
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
        demoUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/musicofficial/BANTINHCADAUTIEN-XUANKEN.mp3',
        mp3Url: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/musicofficial/BANTINHCADAUTIEN-XUANKEN.mp3',
        wavUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/musicofficial/BANTINHCADAUTIEN-XUANKEN.mp3',
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
        demoUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/musicofficial/ANHYEUEMSAITHOIDIEM-XUANKEN.mp3',
        mp3Url: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/musicofficial/ANHYEUEMSAITHOIDIEM-XUANKEN.mp3',
        wavUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/musicofficial/ANHYEUEMSAITHOIDIEM-XUANKEN.mp3',
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
        demoUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/musicofficial/CAUVONGKHUYET-XUANKEN.mp3',
        mp3Url: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/musicofficial/CAUVONGKHUYET-XUANKEN.mp3',
        wavUrl: 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/musicofficial/CAUVONGKHUYET-XUANKEN.mp3',
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
    return await MusicService.saveSongsToFirebase(sampleSongs);
  };

  const updateMemberBalance = async (uid: string, newBalance: number) => {
    try {
      localStorage.setItem(`xuanken_member_balance_${uid}`, newBalance.toString());
    } catch (e) {}
    const updated = members.map((m) => (m.uid === uid ? { ...m, balance: newBalance } : m));
    setMembers(updated);
    if (currentUser?.uid === uid) {
      setCurrentUser({ ...currentUser, balance: newBalance });
      setUserBalance(newBalance);
    }
    const targetMember = updated.find((m) => m.uid === uid);
    if (targetMember) {
      await MusicService.upsertMember(targetMember);
    }
    await MusicService.saveMembers(updated);
  };

  const updateMember = async (uid: string, data: { displayName?: string; role?: 'admin' | 'user'; balance?: number }) => {
    if (data.balance !== undefined) {
      try {
        localStorage.setItem(`xuanken_member_balance_${uid}`, data.balance.toString());
      } catch (e) {}
    }
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
    const targetMember = updated.find((m) => m.uid === uid);
    if (targetMember) {
      await MusicService.upsertMember(targetMember);
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

  const addAdminByEmail = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, message: 'Vui lòng nhập địa chỉ email hợp lệ!' };
    }

    // Check if member already exists in members list
    const existingMember = members.find((m) => m.email.toLowerCase().trim() === cleanEmail);
    if (existingMember) {
      if (existingMember.role === 'admin') {
        return { success: true, message: `Thành viên "${cleanEmail}" hiện đã có quyền Admin toàn quyền!` };
      }
      const updated: AppUser = { ...existingMember, role: 'admin' };
      setMembers((prev) => prev.map((m) => (m.uid === updated.uid ? updated : m)));
      await MusicService.upsertMember(updated);
      return { success: true, message: `Đã cấp quyền Admin toàn quyền cho "${cleanEmail}" thành công!` };
    }

    // Create new admin member entry
    const newAdminUid = `admin_${Date.now()}`;
    const newAdmin: AppUser = {
      uid: newAdminUid,
      email: cleanEmail,
      displayName: cleanEmail.split('@')[0] || 'Admin',
      balance: siteSettings?.defaultStartingBalance ?? 500000,
      purchasedSongIds: [],
      blockedSongIds: [],
      role: 'admin',
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };

    const updatedMembers = [...members, newAdmin];
    setMembers(updatedMembers);
    await MusicService.saveMembers(updatedMembers);
    return {
      success: true,
      message: `Đã tạo quyền Admin toàn quyền cho "${cleanEmail}". Khi tài khoản này đăng nhập sẽ nhận toàn bộ quyền quản trị.`,
    };
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

  // 2. Deep Linking (?song=song-id or ?album=album-id or ?playlist=playlist-id)
  const hasProcessedDeepLinkRef = useRef(false);
  useEffect(() => {
    if (hasProcessedDeepLinkRef.current) return;
    try {
      let songParam: string | null = null;
      let albumParam: string | null = null;
      let playlistParam: string | null = null;

      if (typeof window !== 'undefined') {
        const urlObj = new URL(window.location.href);
        songParam = urlObj.searchParams.get('song');
        albumParam = urlObj.searchParams.get('album');
        playlistParam = urlObj.searchParams.get('playlist');

        // Support hash params as fallback (e.g. #/?song=...)
        if (!songParam && window.location.hash.includes('?')) {
          const hashParams = new URLSearchParams(window.location.hash.split('?')[1]);
          songParam = hashParams.get('song') || songParam;
          albumParam = hashParams.get('album') || albumParam;
          playlistParam = hashParams.get('playlist') || playlistParam;
        }
      }

      if (songParam) {
        const decodedParam = decodeURIComponent(songParam).trim().toLowerCase();

        // Check if library/albums have loaded yet; if not, wait for next render
        const hasSongsLoaded = (songs && songs.length > 0) || (exclusiveAlbums && exclusiveAlbums.length > 0);
        if (!hasSongsLoaded) return;

        // Search in standard songs
        const standardSong = (songs || []).find(
          (s) => s.id.toLowerCase() === decodedParam ||
                 `song-${s.id}`.toLowerCase() === decodedParam ||
                 s.id.toLowerCase() === `song-${decodedParam}`
        );
        if (standardSong) {
          hasProcessedDeepLinkRef.current = true;
          playSong(standardSong);
          return;
        }

        // Search in allSearchableSongs
        const searchableSong = (allSearchableSongs || []).find(
          (s) => s.id.toLowerCase() === decodedParam ||
                 `song-${s.id}`.toLowerCase() === decodedParam ||
                 s.id.toLowerCase() === `song-${decodedParam}`
        );
        if (searchableSong) {
          hasProcessedDeepLinkRef.current = true;
          playSong(searchableSong);
          return;
        }

        // Search in curated albums
        for (const alb of (exclusiveAlbums || [])) {
          const track = (alb.songs || []).find(
            (s) => s.id.toLowerCase() === decodedParam ||
                   `song-${s.id}`.toLowerCase() === decodedParam ||
                   s.id.toLowerCase() === `song-${decodedParam}`
          );
          if (track) {
            hasProcessedDeepLinkRef.current = true;
            setSelectedAlbum(alb);
            playAlbumTrack(track, alb);
            return;
          }
        }
      } else if (albumParam) {
        const decodedAlbum = decodeURIComponent(albumParam).trim().toLowerCase();
        const foundAlb = (exclusiveAlbums || []).find((a) => a.id.toLowerCase() === decodedAlbum);
        if (foundAlb) {
          hasProcessedDeepLinkRef.current = true;
          setSelectedAlbum(foundAlb);
          setActiveDesktopTab('albums');
          setActiveMobileTab('albums');
        }
      } else if (playlistParam) {
        const decodedPl = decodeURIComponent(playlistParam).trim().toLowerCase();
        const foundPl = (playlists || []).find((p) => p.id.toLowerCase() === decodedPl);
        if (foundPl) {
          hasProcessedDeepLinkRef.current = true;
          setSelectedPlaylist(foundPl);
          setActiveDesktopTab('library');
          setActiveMobileTab('library');
        }
      }
    } catch (e) {}
  }, [songs, exclusiveAlbums, playlists, allSearchableSongs]);

  // 3. Playback Rate & Crossfade setters
  const setPlaybackRate = (rate: number) => {
    setPlaybackRateState(rate);
    audioEngine.setPlaybackRate(rate);
  };

  const setCrossfadeDuration = (sec: number) => {
    setCrossfadeDurationState(sec);
    audioEngine.setCrossfadeDuration(sec);
    try {
      localStorage.setItem('xuanken_crossfade_duration', sec.toString());
    } catch (e) {}
    MusicService.saveAudioSettings(preferredAudioFormat, songFormatMap, currentUser?.uid, sec);
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
    if (currentUser?.uid) {
      try {
        localStorage.setItem(`xuanken_playlists_${currentUser.uid}`, JSON.stringify(updated));
      } catch (e) {}
    }
    await MusicService.upsertPlaylist(newPlaylist);
    return newPlaylist;
  };

  const deletePlaylist = async (id: string) => {
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    if (currentUser?.uid) {
      try {
        localStorage.setItem(`xuanken_playlists_${currentUser.uid}`, JSON.stringify(updated));
      } catch (e) {}
    }
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
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(updated);
    }
    if (currentUser?.uid) {
      try {
        localStorage.setItem(`xuanken_playlists_${currentUser.uid}`, JSON.stringify(nextList));
      } catch (e) {}
    }
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
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(updated);
    }
    if (currentUser?.uid) {
      try {
        localStorage.setItem(`xuanken_playlists_${currentUser.uid}`, JSON.stringify(nextList));
      } catch (e) {}
    }
    await MusicService.upsertPlaylist(updated);
  };

  const handleSetPlaybackSource = (source: string) => {
    setPlaybackSource(source);
  };

  const playCustomPool = (poolList: Song[], sourceName: string, shuffleMode: boolean = false, startSong?: Song) => {
    const blocked = blockedSongIdsRef.current;
    const unblocked = poolList.filter((s) => !blocked.includes(s.id));
    if (unblocked.length === 0) return;

    setPlaybackSource(sourceName);
    activePoolModeRef.current = 'playlist';
    recentPlayedIdsRef.current = [];
    setActivePlaylistSongs(unblocked);
    activePlaylistSongsRef.current = unblocked;

    let target: Song;
    if (startSong && unblocked.some((s) => s.id === startSong.id)) {
      target = startSong;
    } else if (shuffleMode) {
      const randIdx = Math.floor(Math.random() * unblocked.length);
      target = unblocked[randIdx];
    } else {
      target = unblocked[0];
    }

    if (shuffleMode) {
      setIsShuffle(true);
      isShuffleRef.current = true;
      const remaining = unblocked.filter((s) => s.id !== target.id);
      const shuffled = [...remaining].sort(() => Math.random() - 0.5);
      setQueue(shuffled);
    } else {
      setIsShuffle(false);
      isShuffleRef.current = false;
      const idx = unblocked.findIndex((s) => s.id === target.id);
      const inOrderQueue = idx !== -1 ? [...unblocked.slice(idx + 1), ...unblocked.slice(0, idx)] : unblocked.slice(1);
      setQueue(inOrderQueue);
    }

    playSong(target);
  };

  const playPlaylist = (playlist: Playlist, mode: 'order' | 'shuffle' = 'order') => {
    const targetIds = Array.isArray(playlist?.songIds) ? playlist.songIds : [];
    const pool = (allSearchableSongs && allSearchableSongs.length > 0) ? allSearchableSongs : songsRef.current;
    const blocked = blockedSongIdsRef.current;
    const uniqueMap = new Map<string, Song>();
    targetIds.forEach((id) => {
      const found = pool.find((s) => s.id === id);
      if (found && !blocked.includes(found.id) && !uniqueMap.has(found.id)) {
        uniqueMap.set(found.id, found);
      }
    });
    const pSongs = Array.from(uniqueMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' })
    );
    if (pSongs.length > 0) {
      if (mode === 'shuffle') {
        const randIdx = Math.floor(Math.random() * pSongs.length);
        playCustomPool(pSongs, playlist.name, true, pSongs[randIdx]);
      } else {
        playCustomPool(pSongs, playlist.name, false, pSongs[0]);
      }
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
    const usedVouchers: string[] = currentUser?.usedVoucherCodes || [];
    if (usedVouchers.includes(cleanCode)) {
      return {
        success: false,
        discountAmount: 0,
        finalPrice: currentPrice,
        message: 'Bạn đã dùng voucher này rồi',
      };
    }

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

  // 7. Download Song (Protected: Must be purchased or Admin)
  const downloadSong = async (song: Song, format: 'MP3' | 'WAV' = 'MP3') => {
    if (!isSongPurchased(song.id) && !isAdmin) {
      return {
        success: false,
        message: 'Bạn chưa mua bản quyền bài hát này. Vui lòng thanh toán trước khi tải về!',
      };
    }
    return MusicService.downloadSongAudio(song, format);
  };

  // -------------------------------------------------------------
  // Exclusive / Curated Albums (Album Nhạc Hay - Strict Isolation)
  // -------------------------------------------------------------
  const addExclusiveAlbum = async (albumData: Omit<ExclusiveAlbum, 'id' | 'createdAt' | 'songs'>): Promise<ExclusiveAlbum> => {
    const id = 'alb-' + Date.now();
    const newAlbum: ExclusiveAlbum = {
      ...albumData,
      id,
      songs: [],
      createdAt: new Date().toISOString(),
    };
    const updated = [newAlbum, ...exclusiveAlbums];
    setExclusiveAlbums(updated);
    await MusicService.saveExclusiveAlbums(updated);
    return newAlbum;
  };

  const updateExclusiveAlbum = async (id: string, albumData: Partial<ExclusiveAlbum>) => {
    const updated = exclusiveAlbums.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          ...albumData,
          songs: Array.isArray(albumData.songs) ? albumData.songs : (a.songs || []),
        };
      }
      return a;
    });
    setExclusiveAlbums(updated);
    if (selectedAlbum?.id === id) {
      setSelectedAlbum((prev) => (prev ? {
        ...prev,
        ...albumData,
        songs: Array.isArray(albumData.songs) ? albumData.songs : (prev.songs || []),
      } : null));
    }
    await MusicService.saveExclusiveAlbums(updated);
  };

  const deleteExclusiveAlbum = async (id: string) => {
    const updated = exclusiveAlbums.filter((a) => a.id !== id);
    setExclusiveAlbums(updated);
    if (selectedAlbum?.id === id) {
      setSelectedAlbum(null);
    }
    await MusicService.deleteExclusiveAlbum(id);
    await MusicService.saveExclusiveAlbums(updated);
  };

  const addSongToAlbum = async (albumId: string, songData: Omit<AlbumSong, 'id' | 'albumId' | 'createdAt'>): Promise<AlbumSong> => {
    const songId = 'albsong-' + Date.now();
    const existingAlbum = exclusiveAlbums.find((a) => a.id === albumId);
    const existingSongs = Array.isArray(existingAlbum?.songs) ? existingAlbum.songs : [];
    const newSong: AlbumSong = {
      ...songData,
      id: songId,
      albumId,
      stt: existingSongs.length + 1,
      createdAt: new Date().toISOString(),
    };
    const updated = exclusiveAlbums.map((a) => {
      if (a.id === albumId) {
        const curSongs = Array.isArray(a.songs) ? a.songs : [];
        const nextSongs = [...curSongs, newSong].map((s, idx) => ({ ...s, stt: idx + 1 }));
        return {
          ...a,
          songs: nextSongs,
        };
      }
      return a;
    });
    setExclusiveAlbums(updated);
    if (selectedAlbum?.id === albumId) {
      setSelectedAlbum((prev) => {
        if (!prev) return null;
        const curSongs = Array.isArray(prev.songs) ? prev.songs : [];
        const nextSongs = [...curSongs, newSong].map((s, idx) => ({ ...s, stt: idx + 1 }));
        return {
          ...prev,
          songs: nextSongs,
        };
      });
    }
    await MusicService.saveExclusiveAlbums(updated);
    return newSong;
  };

  const updateSongInAlbum = async (albumId: string, songId: string, songData: Partial<AlbumSong>) => {
    const updated = exclusiveAlbums.map((a) => {
      if (a.id === albumId) {
        const curSongs = Array.isArray(a.songs) ? a.songs : [];
        return {
          ...a,
          songs: curSongs.map((s) => (s.id === songId ? { ...s, ...songData } : s)),
        };
      }
      return a;
    });
    setExclusiveAlbums(updated);
    if (selectedAlbum?.id === albumId) {
      setSelectedAlbum((prev) => {
        if (!prev) return null;
        const curSongs = Array.isArray(prev.songs) ? prev.songs : [];
        return {
          ...prev,
          songs: curSongs.map((s) => (s.id === songId ? { ...s, ...songData } : s)),
        };
      });
    }
    await MusicService.saveExclusiveAlbums(updated);
  };

  const removeSongFromAlbum = async (albumId: string, songId: string) => {
    const updated = exclusiveAlbums.map((a) => {
      if (a.id === albumId) {
        const curSongs = Array.isArray(a.songs) ? a.songs : [];
        const filtered = curSongs.filter((s) => s.id !== songId).map((s, idx) => ({ ...s, stt: idx + 1 }));
        return {
          ...a,
          songs: filtered,
        };
      }
      return a;
    });
    setExclusiveAlbums(updated);
    if (selectedAlbum?.id === albumId) {
      setSelectedAlbum((prev) => {
        if (!prev) return null;
        const curSongs = Array.isArray(prev.songs) ? prev.songs : [];
        const filtered = curSongs.filter((s) => s.id !== songId).map((s, idx) => ({ ...s, stt: idx + 1 }));
        return {
          ...prev,
          songs: filtered,
        };
      });
    }
    await MusicService.saveExclusiveAlbums(updated);
  };

  const reorderSongInAlbum = async (albumId: string, songId: string, direction: 'up' | 'down') => {
    const album = exclusiveAlbums.find((a) => a.id === albumId);
    if (!album) return;
    const curSongs = Array.isArray(album.songs) ? [...album.songs] : [];
    const idx = curSongs.findIndex((s) => s.id === songId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === curSongs.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = curSongs[idx];
    curSongs[idx] = curSongs[targetIdx];
    curSongs[targetIdx] = temp;

    const reindexed = curSongs.map((s, i) => ({ ...s, stt: i + 1 }));
    const updated = exclusiveAlbums.map((a) => (a.id === albumId ? { ...a, songs: reindexed } : a));
    setExclusiveAlbums(updated);
    if (selectedAlbum?.id === albumId) {
      setSelectedAlbum((prev) => (prev ? { ...prev, songs: reindexed } : null));
    }
    await MusicService.saveExclusiveAlbums(updated);
  };

  const seedDefaultAlbums = async (): Promise<{ success: boolean; error?: string }> => {
    const res = await MusicService.seedDefaultAlbums();
    if (res.success) {
      const refreshed = await MusicService.fetchExclusiveAlbums();
      setExclusiveAlbums(refreshed);
    }
    return res;
  };

  const syncExclusiveAlbumsToFirebase = async (): Promise<{ success: boolean; rtdb: boolean; firestore: boolean; error?: string }> => {
    return await MusicService.saveExclusiveAlbums(exclusiveAlbums);
  };

  const playAlbumTrack = (track: AlbumSong, album: ExclusiveAlbum, shuffle: boolean = false) => {
    // Strictly convert album tracks for isolated playback without altering the global songs catalog
    const rawList = Array.isArray(album?.songs) ? album.songs : [];
    const isNhacTre =
      album?.title?.toLowerCase().includes('nhạc trẻ') ||
      (album?.genre && album?.genre?.toLowerCase().includes('nhạc trẻ')) ||
      album?.title?.toLowerCase().includes('tuyển tập');
    const albumSongsList = isNhacTre
      ? [...rawList].sort((a, b) => a.title.localeCompare(b.title, 'vi', { sensitivity: 'base' }))
      : rawList;

    const albumAsSongs: Song[] = albumSongsList.map((s, idx) => ({
      id: s.id,
      stt: s.stt || idx + 1,
      title: s.title,
      artists: s.artists || album.artist || 'XuanKen Official',
      duration: s.duration && s.duration > 0 ? s.duration : 210,
      audioFormat: s.audioFormat || 'MP3',
      coverImage: s.coverImage || album.coverImage,
      coverGradient: 'from-purple-900 to-indigo-950',
      album: album.title,
      price: 0,
      isPurchased: true,
      demoUrl: s.demoUrl || s.mp3Url || s.wavUrl,
      mp3Url: s.mp3Url,
      wavUrl: s.wavUrl,
      lyrics: s.lyrics || [],
      lrcRaw: s.lrcRaw,
      plays: `${(s.playCount || 0).toLocaleString('vi-VN')} lượt nghe`,
      playCount: s.playCount || 0,
      isAlbumTrack: true,
      albumId: album.id,
    }));

    handleSetPlaybackSource(`Album: ${album.title}`);
    activePoolModeRef.current = 'album';
    recentPlayedIdsRef.current = [];
    setActivePlaylistSongs(albumAsSongs);
    activePlaylistSongsRef.current = albumAsSongs;

    const target = albumAsSongs.find((s) => s.id === track.id) || albumAsSongs[0];
    if (target) {
      if (shuffle) {
        setIsShuffle(true);
        isShuffleRef.current = true;
        const remaining = albumAsSongs.filter((s) => s.id !== target.id);
        const shuffled = [...remaining].sort(() => Math.random() - 0.5);
        setQueue(shuffled);
        playSong(target);
      } else {
        setIsShuffle(false);
        isShuffleRef.current = false;
        const idx = albumAsSongs.findIndex((s) => s.id === target.id);
        const customQueue = idx !== -1 ? [...albumAsSongs.slice(idx + 1), ...albumAsSongs.slice(0, idx)] : albumAsSongs.slice(1);
        setQueue(customQueue);
        playSong(target);
      }
    }
  };

  // Re-fetch members whenever admin role or current user UID is established (Requirement 11)
  useEffect(() => {
    if (isAdmin || currentUser?.uid) {
      MusicService.fetchMembers().then((loadedMembers) => {
        if (loadedMembers && loadedMembers.length > 0) {
          setMembers(loadedMembers);
        } else if (currentUser) {
          setMembers([currentUser]);
        }
      });
    }
  }, [isAdmin, currentUser?.uid]);

  // -------------------------------------------------------------
  // Community Chat Box Methods (Requirement 9: Deduplicate to prevent double-message)
  // -------------------------------------------------------------
  const sendChatMessage = async (content: string, sharedSong?: ChatMessage['sharedSong']) => {
    if (!currentUser) {
      setIsLoginModalOpen(true);
      return;
    }
    const senderName = currentUser.displayName || 'Thành Viên';
    const senderRole = currentUser.role === 'admin' ? 'admin' : 'user';
    const senderAvatar = currentUser.avatarUrl;
    const senderUid = currentUser.uid;

    const newMsg = await MusicService.sendChatMessage({
      userId: senderUid,
      userName: senderName,
      userRole: senderRole,
      userAvatar: senderAvatar,
      content,
      timestamp: Date.now(),
      sharedSong,
    });

    setChatMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  };

  const deleteChatMessage = async (id: string) => {
    await MusicService.deleteChatMessage(id);
    setChatMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const editChatMessage = async (id: string, newContent: string) => {
    await MusicService.editChatMessage(id, newContent);
    setChatMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content: newContent, isEdited: true } : m)));
  };

  const togglePinChatMessage = async (id: string, isPinned: boolean) => {
    await MusicService.togglePinChatMessage(id, isPinned);
    setChatMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isPinned } : m)));
  };

  // Load banned members on mount
  useEffect(() => {
    MusicService.fetchBannedUsers().then((map) => {
      if (map) setBannedMembers(map);
    });
  }, []);

  const banChatMember = async (userId: string, userName: string, durationMinutes: number | null) => {
    await MusicService.banChatMember(userId, userName, durationMinutes);
    const bannedAt = Date.now();
    const bannedUntil = durationMinutes ? bannedAt + durationMinutes * 60 * 1000 : null;
    setBannedMembers((prev) => ({
      ...prev,
      [userId]: { bannedUntil, bannedAt, userName },
    }));
  };

  const unbanChatMember = async (userId: string) => {
    await MusicService.unbanChatMember(userId);
    setBannedMembers((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });
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
        allSearchableSongs,
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
        setSleepTimerSeconds,
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
        isProfileModalOpen,
        setIsProfileModalOpen,
        setSongToBuy,
        setSelectedLrcSong,
        setActiveDesktopTab,
        canGoBack,
        canGoForward,
        navigateBack,
        navigateForward,
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
        addAdminByEmail,
        preferredAudioFormat,
        setPreferredAudioFormat,
        crossfadeDuration,
        setCrossfadeDuration,
        playbackRate,
        setPlaybackRate,
        isAudioSettingsModalOpen,
        setIsAudioSettingsModalOpen,
        playlists,
        selectedPlaylist,
        setSelectedPlaylist,
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
        weeklyPlays,
        currentWeekKey,
        blockedSongIds,
        blockSong,
        unblockSong,
        isSongBlocked,
        reportSongIssue,
        siteSettings,
        updateSiteSettings,
        playbackSource,
        setPlaybackSource: handleSetPlaybackSource,

        // Exclusive Albums & Chat Box
        exclusiveAlbums,
        selectedAlbum,
        setSelectedAlbum,
        addExclusiveAlbum,
        updateExclusiveAlbum,
        deleteExclusiveAlbum,
        addSongToAlbum,
        updateSongInAlbum,
        removeSongFromAlbum,
        reorderSongInAlbum,
        seedDefaultAlbums,
        syncExclusiveAlbumsToFirebase,
        playAlbumTrack,
        playCustomPool,

        chatMessages,
        sendChatMessage,
        editChatMessage,
        deleteChatMessage,
        togglePinChatMessage,
        banChatMember,
        unbanChatMember,
        bannedMembers,

        // Artist Biographies (Tiểu Sử Ca Sĩ)
        artistBios,
        selectedArtistName,
        setSelectedArtistName,
        navigateToArtist,
        upsertArtistBio,
        deleteArtistBio,
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

export const formatSleepTimerFull = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined || seconds <= 0) return '';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${hrs.toString().padStart(2, '0')} giờ ${mins.toString().padStart(2, '0')} phút ${secs.toString().padStart(2, '0')} giây`;
};

export const formatSleepTimerDigital = (seconds: number | null | undefined): string => {
  if (seconds === null || seconds === undefined || seconds <= 0) return '';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
