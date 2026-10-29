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
  plays?: string;
  playCount?: number; // Lượt nghe thời gian thực cho #xuankenchart
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
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl?: string; // Link ảnh hoặc base64 ảnh đại diện
  balance: number; // Số dư ví VNĐ
  purchasedSongIds: string[];
  blockedSongIds?: string[]; // Danh sách bài hát bị chặn
  role: 'admin' | 'user';
  createdAt: string;
}

export type ThemeId = 'purple' | 'blue' | 'sunset' | 'emerald' | 'gold' | 'dark' | 'rose' | 'light';

export type RepeatMode = 'off' | 'all' | 'one';

export type ActiveDesktopTab = 'discover' | 'store' | 'admin' | 'chart' | 'radio' | 'library' | 'weeklyTop';

export type ActiveMobileTab = 'discover' | 'store' | 'admin' | 'chart' | 'library' | 'profile';

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

export interface RewindStats {
  totalSeconds: number;
  totalPlays: number;
  songPlays: Record<string, number>;
  artistPlays: Record<string, number>;
  favoriteGenre?: string;
  lastUpdated: string;
}

export interface WeeklyTopData {
  weekKey: string; // e.g. "2026-W44"
  songPlays: Record<string, number>;
  lastResetAt: string;
}
