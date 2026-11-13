export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export type AudioFormat = 'MP3' | 'WAV';

export interface Song {
  id: string;
  stt?: number;
  title: string;
  artists: string;
  duration: number; // in seconds
  coverGradient?: string;
  coverImage?: string; // Link ảnh bìa trực tuyến
  album?: string;
  releaseDate?: string;
  composer?: string; // Nhạc sĩ sáng tác
  genre?: string; // Thể loại nhạc (e.g. Việt Nam, V-Pop)
  provider?: string; // Đơn vị cung cấp / phát hành (e.g. VIEENT Music)
  plays?: string;
  playCount?: number; // Lượt nghe thời gian thực cho #xuankenchart
  likesCount?: number; // Lượt tim thời gian thực
  lyrics: LyricLine[];
  lrcRaw?: string;
  lrcUrl?: string; // external .lrc link or text
  audioFormat: AudioFormat; // 'MP3' | 'WAV'
  price: number; // in VND
  isPurchased?: boolean;
  demoUrl?: string; // Link nhạc demo 60 giây
  mp3Url?: string;  // Link nhạc MP3 (320kbps)
  wavUrl?: string;  // Link nhạc WAV Lossless
  rankChange?: 'up' | 'down' | 'same';
  rankChangeValue?: number;
  isAlbumTrack?: boolean;
  albumId?: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string; // Link ảnh hoặc base64 ảnh đại diện
  balance: number; // Số dư ví VNĐ
  purchasedSongIds: string[];
  likedSongIds?: string[]; // Danh sách ID bài hát đã tim đồng bộ đa thiết bị
  blockedSongIds?: string[]; // Danh sách bài hát bị chặn
  usedVoucherCodes?: string[]; // Danh sách mã voucher đã dùng
  theme?: ThemeId;
  crossfadeDuration?: number;
  preferredAudioFormat?: AudioFormat;
  role: 'admin' | 'user';
  createdAt: string;
}

export type ThemeId =
  | 'zma'
  | 'dark'
  | 'purple'
  | 'dark-blue'
  | 'blue'
  | 'green'
  | 'brown'
  | 'pink'
  | 'red'
  | 'light'
  | 'gray'
  | 'light-blue'
  | 'lotus-pink'
  | 'sunset'
  | 'emerald'
  | 'gold'
  | 'rose';

export type RepeatMode = 'off' | 'all' | 'one';

export type ActiveDesktopTab = 'discover' | 'store' | 'admin' | 'chart' | 'albums' | 'artists' | 'chat' | 'radio' | 'library' | 'weeklyTop';

export type ActiveMobileTab = 'discover' | 'store' | 'admin' | 'chart' | 'albums' | 'artists' | 'chat' | 'library' | 'profile';

export interface ArtistBio {
  id: string;
  name: string; // Tên nghệ danh chính (VD: Sơn Tùng M-TP)
  realName?: string; // Tên thật (VD: Nguyễn Thanh Tùng)
  avatarUrl: string; // Ảnh chân dung chất lượng cao
  bannerUrl?: string; // Ảnh bìa / sân khấu
  birthDate?: string; // Ngày sinh (VD: 05/07/1994)
  hometown?: string; // Quê quán (VD: Thái Bình)
  genres?: string[]; // Thể loại nhạc (VD: ['V-Pop', 'R&B', 'Hip Hop'])
  debutYear?: string; // Năm ra mắt / bắt đầu hoạt động (VD: 2012)
  bio: string; // Câu chuyện tiểu sử chi tiết
  achievements?: string[]; // Các thành tích & giải thưởng tiêu biểu
  isVerified?: boolean; // Nghệ sĩ đã xác minh chính thức (hiển thị badge ĐÃ XÁC MINH)
  socialLinks?: {
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    instagram?: string;
  };
}

export interface AlbumSong {
  id: string;
  albumId: string;
  stt?: number;
  title: string;
  artists: string;
  duration: number; // in seconds
  audioFormat: AudioFormat; // 'MP3' | 'WAV'
  coverImage?: string;
  mp3Url?: string;
  wavUrl?: string;
  demoUrl?: string;
  lrcRaw?: string;
  lyrics?: LyricLine[];
  playCount?: number;
  createdAt?: string;
}

export interface ExclusiveAlbum {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  description: string;
  releaseYear?: string;
  genre?: string;
  songs: AlbumSong[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: 'admin' | 'user';
  content: string;
  timestamp: number;
  sharedSong?: {
    id: string;
    title: string;
    artists: string;
    coverImage?: string;
    mp3Url?: string;
    wavUrl?: string;
    duration?: number;
    isAlbumTrack?: boolean;
    albumTitle?: string;
  };
  isPinned?: boolean;
  isEdited?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  songIds: string[];
  userId?: string;
  createdAt: string;
}

export interface Voucher {
  id: string;
  code: string; // e.g. XUANKEN50
  discountType: 'percent' | 'fixed'; // percent or fixed
  discountValue: number;
  minSpend?: number;
  description: string;
  isActive: boolean;
}

export interface WeeklyTopData {
  weekKey: string; // e.g. "2026-W44"
  songPlays: Record<string, number>;
  lastResetAt: string;
}

export interface SiteSettings {
  siteName: string;
  siteSlogan: string;
  logoUrl: string;
  faviconUrl: string;
  defaultStartingBalance: number;
  defaultSongPrice: number;
  minListenDurationSeconds: number;
}

export interface Purchase {
  id: string;
  userId: string;
  userEmail?: string;
  songId: string;
  songTitle: string;
  price: number;
  timestamp: string;
}

export interface SongReport {
  id: string;
  songId: string;
  issue: string;
  userEmail: string;
  createdAt: string;
}
