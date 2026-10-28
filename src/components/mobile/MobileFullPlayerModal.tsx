import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  MoreVertical,
  Heart,
  Shuffle,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Repeat,
  Repeat1,
  Clock,
  ListMusic,
  Disc3,
  Sparkles,
  Share2,
  ListPlus,
  Download,
  Palette,
  X,
  Waves,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Visualizer } from '../common/Visualizer';

export const MobileFullPlayerModal: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextSong,
    prevSong,
    seekTo,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    likedSongIds,
    toggleLike,
    isMobileFullPlayerOpen,
    setIsMobileFullPlayerOpen,
    setIsSleepTimerModalOpen,
    sleepTimerRemainingSeconds,
    queue,
    playSong,
    isSongPurchased,
    openShareModal,
    openAddToPlaylistModal,
    setIsAudioSettingsModalOpen,
    setIsThemeModalOpen,
    setSongToBuy,
    setIsDemoLimitModalOpen,
    preferredAudioFormat,
    songFormatMap,
    setSongAudioFormat,
    openDownloadModal,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'disc' | 'lyrics'>('disc');
  const [showQueueSheet, setShowQueueSheet] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  if (!isMobileFullPlayerOpen || !currentSong) return null;

  const isLiked = likedSongIds.includes(currentSong.id);
  const currentFormat = songFormatMap[currentSong.id] || preferredAudioFormat;
  const lyrics = currentSong.lyrics || [];
  const activeLyricIdx = lyrics.findIndex(
    (line, index) =>
      currentTime >= line.time &&
      (index === lyrics.length - 1 || currentTime < lyrics[index + 1].time)
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#120822] text-white select-none animate-in slide-in-from-bottom duration-300 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
        <div
          className={`absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[100px] bg-gradient-to-tr ${currentSong.coverGradient}`}
        />
        <div
          className={`absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-[100px] bg-gradient-to-br ${currentSong.coverGradient}`}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 px-4 py-2.5 flex items-center justify-between border-b border-white/5">
        <button
          onClick={() => {
            setIsMobileFullPlayerOpen(false);
            setIsHeaderMenuOpen(false);
          }}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/80 active:scale-95 transition-transform"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center truncate px-4">
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">
            Đang phát từ Playlist
          </p>
          <p className="text-xs font-bold text-white truncate">{currentSong.album || 'XuanKen Music Official'}</p>
        </div>

        {/* 3-dots Menu Button at top-right with sleep timer moved into it */}
        <div className="relative">
          <button
            onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
            className="p-2 -mr-2 rounded-full hover:bg-white/10 text-white/80 active:scale-95 transition-transform"
            title="Tùy chọn mở rộng"
          >
            <MoreVertical className="w-5 h-5" />
            {sleepTimerRemainingSeconds !== null && (
              <span className="absolute top-1 right-0 w-2 h-2 bg-amber-400 rounded-full border border-black" />
            )}
          </button>

          {isHeaderMenuOpen && (
            <div className="absolute right-0 top-10 w-52 bg-[#231b2e] border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 text-xs text-white space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
              {/* Hẹn giờ tắt nhạc (Chuyển vào 3 chấm dọc theo yêu cầu) */}
              <button
                onClick={() => {
                  setIsHeaderMenuOpen(false);
                  setIsSleepTimerModalOpen(true);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hẹn giờ tắt nhạc</span>
                </div>
                {sleepTimerRemainingSeconds !== null && (
                  <span className="text-[10px] font-bold text-amber-300 font-mono">
                    {Math.ceil(sleepTimerRemainingSeconds / 60)}p
                  </span>
                )}
              </button>

              {/* Cài đặt âm thanh (Crossfade) */}
              <button
                onClick={() => {
                  setIsHeaderMenuOpen(false);
                  setIsAudioSettingsModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
              >
                <Waves className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nối nhạc Crossfade</span>
              </button>

              {/* Đổi chủ đề */}
              <button
                onClick={() => {
                  setIsHeaderMenuOpen(false);
                  setIsThemeModalOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
              >
                <Palette className="w-3.5 h-3.5 text-[#c273ed]" />
                <span>Đổi giao diện / Theme</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Tabs Switch: Đĩa nhạc | Lời bài hát */}
      <div className="relative z-10 flex items-center justify-center gap-6 pt-3 text-xs font-bold shrink-0">
        <button
          onClick={() => setActiveTab('disc')}
          className={`pb-1 border-b-2 transition-all ${
            activeTab === 'disc'
              ? 'border-[#9b4de0] text-white'
              : 'border-transparent text-white/50'
          }`}
        >
          ĐĨA NHẠC
        </button>
        <button
          onClick={() => setActiveTab('lyrics')}
          className={`pb-1 border-b-2 transition-all ${
            activeTab === 'lyrics'
              ? 'border-[#9b4de0] text-white'
              : 'border-transparent text-white/50'
          }`}
        >
          LỜI BÀI HÁT
        </button>
      </div>

      {/* Center View */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2 overflow-hidden min-h-0">
        {activeTab === 'disc' ? (
          /* Rotating Vinyl View - Optimized size for all screens */
          <div className="flex flex-col items-center justify-center w-full max-h-[42vh] my-auto">
            <div className="relative w-[min(65vw,250px)] h-[min(65vw,250px)] max-h-[36vh] aspect-square rounded-full bg-zinc-950 p-2.5 shadow-2xl border-4 border-zinc-800/60 flex items-center justify-center">
              {/* Outer Grooves */}
              <div className="absolute inset-2 rounded-full border border-zinc-800/80 pointer-events-none" />
              <div className="absolute inset-4 rounded-full border border-zinc-800/60 pointer-events-none" />

              {/* Spinning Disc Center */}
              <div
                className={`w-full h-full rounded-full bg-gradient-to-tr ${
                  currentSong.coverGradient || 'from-purple-600 to-indigo-800'
                } flex items-center justify-center overflow-hidden animate-spin-slow ${
                  !isPlaying ? 'paused' : ''
                } shadow-inner relative`}
              >
                {currentSong.coverImage ? (
                  <img
                    src={currentSong.coverImage}
                    alt={currentSong.title}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <Disc3 className="w-16 h-16 text-white/70" />
                )}
              </div>
            </div>

            {/* Sound Wave Spectrum */}
            <div className="mt-3 sm:mt-5 flex items-center justify-center">
              <Visualizer barCount={18} height={16} color="#9b4de0" />
            </div>
          </div>
        ) : (
          /* Synchronized Karaoke Lyrics View */
          <div
            ref={lyricsContainerRef}
            className="w-full h-full overflow-y-auto px-4 py-6 space-y-4 text-center select-none"
          >
            {lyrics.map((line, idx) => {
              const isCurrent = idx === activeLyricIdx;
              const isPast = idx < activeLyricIdx;
              return (
                <p
                  key={idx}
                  data-idx={idx}
                  onClick={() => seekTo(line.time)}
                  className={`cursor-pointer transition-all duration-200 font-bold ${
                    isCurrent
                      ? 'text-lg sm:text-xl text-amber-300 scale-105 drop-shadow-[0_2px_12px_rgba(251,191,36,0.6)]'
                      : isPast
                      ? 'text-xs sm:text-sm text-white/40'
                      : 'text-xs sm:text-sm text-white/60'
                  }`}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        )}
      </main>

      {/* Song Info Bar: Share on Left, Centered Title & Artist (No WAV badge), Heart on Right */}
      <div className="relative z-10 px-5 flex items-center justify-between gap-3 shrink-0">
        {/* Left: Share Icon */}
        <button
          onClick={() => openShareModal(currentSong)}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white active:scale-95 transition-all shrink-0"
          title="Chia sẻ bài hát"
        >
          <Share2 className="w-5 h-5" />
        </button>

        {/* Center: Title & Artist (Centered, NO WAV badge) */}
        <div className="flex-1 min-w-0 text-center px-2">
          <h2 className="text-base sm:text-lg font-bold text-white truncate">
            {currentSong.title}
          </h2>
          <p className="text-xs text-white/60 truncate mt-0.5">{currentSong.artists}</p>
        </div>

        {/* Right: Heart / Like Icon */}
        <button
          onClick={() => toggleLike(currentSong.id)}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-red-400 active:scale-95 transition-all shrink-0"
          title="Yêu thích bài hát"
        >
          <Heart
            className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : ''}`}
          />
        </button>
      </div>

      {/* Scrubber Slider */}
      <div className="relative z-10 px-6 mt-3 shrink-0">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
          />
          {/* Yellow Dot (Chấm vàng 60s) if not purchased */}
          {!isSongPurchased(currentSong.id) && duration > 60 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -ml-1.5 flex flex-col items-center pointer-events-none z-10"
              style={{ left: `${(60 / duration) * 100}%` }}
              title="Chấm vàng: Hết hạn nghe thử 60s - Mua nhạc để nghe full bài"
            >
              <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-[#120822] shadow-[0_0_8px_#f59e0b]" />
              <div className="w-0.5 h-2 bg-amber-400/80 -mt-0.5" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] text-white/50 mt-1 tabular-nums font-medium">
          <span>{formatTime(currentTime)}</span>
          <span className="flex items-center gap-1">
            {!isSongPurchased(currentSong.id) && (
              <span className="text-[9px] text-amber-300 font-bold bg-amber-400/10 px-1 py-0.2 rounded border border-amber-400/20">
                Demo 60s (Chấm vàng)
              </span>
            )}
            <span>{formatTime(duration)}</span>
          </span>
        </div>
      </div>

      {/* Big Playback Controls Row */}
      <div className="relative z-10 px-6 py-2 sm:py-3 flex items-center justify-between max-w-sm mx-auto w-full shrink-0">
        <button
          onClick={toggleShuffle}
          className={`p-2 transition-colors ${
            isShuffle ? 'text-[#c273ed]' : 'text-white/50'
          }`}
        >
          <Shuffle className="w-5 h-5" />
        </button>

        <button onClick={prevSong} className="p-2 text-white/80 active:scale-95">
          <SkipBack className="w-7 h-7 fill-current" />
        </button>

        <button
          onClick={togglePlay}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#9b4de0] hover:bg-[#8539c9] text-white flex items-center justify-center shadow-xl shadow-[#9b4de0]/40 active:scale-95 transition-transform"
        >
          {isPlaying ? (
            <Pause className="w-7 h-7 fill-current" />
          ) : (
            <Play className="w-7 h-7 fill-current ml-1" />
          )}
        </button>

        <button onClick={nextSong} className="p-2 text-white/80 active:scale-95">
          <SkipForward className="w-7 h-7 fill-current" />
        </button>

        <button
          onClick={toggleRepeat}
          className={`p-2 transition-colors ${
            repeatMode !== 'off' ? 'text-[#c273ed]' : 'text-white/50'
          }`}
        >
          {repeatMode === 'one' ? (
            <Repeat1 className="w-5 h-5" />
          ) : (
            <Repeat className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Bottom Features Row: Đổi Giao Diện, Thêm Playlist, MP3 / LOSSLESS, Tải Nhạc, Danh Sách Phát */}
      <footer className="relative z-10 px-5 pb-5 pt-2 flex items-center justify-between text-xs text-white/70 border-t border-white/5 shrink-0">
        {/* 1. Đổi giao diện chỉ icon thôi */}
        <button
          onClick={() => setIsThemeModalOpen(true)}
          className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors active:scale-95"
          title="Đổi chủ đề giao diện"
        >
          <Palette className="w-5 h-5" />
        </button>

        {/* 2. Thêm bài hát vào playlist */}
        <button
          onClick={() => openAddToPlaylistModal(currentSong)}
          className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors active:scale-95"
          title="Thêm vào playlist"
        >
          <ListPlus className="w-5 h-5" />
        </button>

        {/* 3. Chọn chất lượng nhạc nghe MP3 và LOSSLESS */}
        <div className="flex items-center p-0.5 rounded-xl bg-white/10 border border-white/10 text-[10px] font-bold">
          <button
            onClick={() => {
              setSongAudioFormat(currentSong.id, 'MP3');
              playSong(currentSong, 'MP3');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              currentFormat === 'MP3'
                ? 'bg-blue-600 text-white shadow font-black'
                : 'text-white/60 hover:text-white'
            }`}
            title="Nghe chất lượng MP3"
          >
            MP3
          </button>
          <button
            onClick={() => {
              setSongAudioFormat(currentSong.id, 'WAV');
              playSong(currentSong, 'WAV');
            }}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              currentFormat === 'WAV'
                ? 'bg-amber-600 text-white shadow font-black'
                : 'text-white/60 hover:text-white'
            }`}
            title="Nghe chất lượng Lossless WAV"
          >
            LOSSLESS
          </button>
        </div>

        {/* 4. Icon tải nhạc (thay thế karaoke) */}
        <button
          onClick={() => {
            if (isSongPurchased(currentSong.id)) {
              openDownloadModal(currentSong);
            } else {
              setSongToBuy(currentSong);
              setIsDemoLimitModalOpen(true);
            }
          }}
          className="p-2 rounded-xl hover:bg-white/10 text-emerald-400 hover:text-emerald-300 transition-colors active:scale-95"
          title={isSongPurchased(currentSong.id) ? "Tải bài hát về máy" : "Mua & Tải bài hát"}
        >
          <Download className="w-5 h-5" />
        </button>

        {/* 5. Icon danh sách phát */}
        <button
          onClick={() => setShowQueueSheet(true)}
          className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors active:scale-95"
          title="Danh sách phát"
        >
          <ListMusic className="w-5 h-5" />
        </button>
      </footer>

      {/* Bottom Queue Sheet for Mobile */}
      {showQueueSheet && (
        <div className="absolute inset-x-0 bottom-0 top-36 z-50 bg-[#170f23] rounded-t-3xl border-t border-white/10 p-4 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-white">Danh sách phát ({queue.length})</h3>
            <button
              onClick={() => setShowQueueSheet(false)}
              className="text-xs text-[#c273ed] font-semibold"
            >
              Đóng
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-2 space-y-2">
            {queue.map((song) => (
              <div
                key={song.id}
                onClick={() => {
                  playSong(song);
                  setShowQueueSheet(false);
                }}
                className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10"
              >
                <div className="truncate pr-2">
                  <p className="text-xs font-semibold text-white truncate">{song.title}</p>
                  <p className="text-[10px] text-white/50 truncate">{song.artists}</p>
                </div>
                <Play className="w-3.5 h-3.5 text-white/60 fill-current" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
