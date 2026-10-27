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
  duration: number; // calculated or specified in seconds
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
  balance: number; // Số dư ví VNĐ
  purchasedSongIds: string[];
  role: 'admin' | 'user';
  createdAt: string;
}

export type ThemeId = 'purple' | 'blue' | 'sunset' | 'light';

export type RepeatMode = 'off' | 'all' | 'one';

export type ActiveDesktopTab = 'discover' | 'store' | 'admin' | 'chart' | 'radio' | 'library';

export type ActiveMobileTab = 'discover' | 'store' | 'admin' | 'chart' | 'library';
