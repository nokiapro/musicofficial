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
  ListMusic,
  Disc3,
  Share2,
  ListPlus,
  Download,
  Palette,
  X,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Visualizer } from '../common/Visualizer';
import { MobilePlayerActionSheet } from './MobilePlayerActionSheet';

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
    sleepTimerRemainingSeconds,
    queue,
    playSong,
    isSongPurchased,
    openShareModal,
    openAddToPlaylistModal,
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
  // Requirement 20: 3-dots action sheet
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  // Requirement 19: Dragging seek state
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);

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

  const displayTime = isDragging && dragTime !== null ? dragTime : currentTime;

  // Requirement 18: FIX DURATION BUG (was returning string seconds leading to 4:299)
  const formatTime = (rawSecs: number | undefined | null) => {
    if (rawSecs === undefined || rawSecs === null || isNaN(rawSecs) || !isFinite(rawSecs) || rawSecs < 0) {
      return '0:00';
    }
    const totalSecs = Math.floor(rawSecs);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekCommit = (val: number) => {
    seekTo(val);
    setIsDragging(false);
    setDragTime(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-[#120822] text-white select-none animate-in slide-in-from-bottom duration-300 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
          <div
            className={`absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[100px] bg-gradient-to-tr ${currentSong.coverGradient || 'from-purple-600 to-indigo-800'}`}
          />
          <div
            className={`absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-[100px] bg-gradient-to-br ${currentSong.coverGradient || 'from-purple-600 to-indigo-800'}`}
          />
        </div>

        {/* Top Header */}
        <header className="relative z-20 px-4 py-2 flex items-center justify-between border-b border-white/5 shrink-0">
          <button
            onClick={() => setIsMobileFullPlayerOpen(false)}
            className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/80 active:scale-95 transition-transform"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="text-center truncate px-4">
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">
              Đang phát từ Playlist
            </p>
            <p className="text-xs font-bold text-white truncate max-w-[200px] mx-auto">
              {currentSong.album || 'XuanKen Music Official'}
            </p>
          </div>

          {/* Requirement 20: 3-dots Menu Button */}
          <button
            onClick={() => setIsActionSheetOpen(true)}
            className="p-2 -mr-2 rounded-full hover:bg-white/10 text-white/80 active:scale-95 transition-transform relative cursor-pointer"
            title="Tùy chọn mở rộng"
          >
            <MoreVertical className="w-5 h-5" />
            {sleepTimerRemainingSeconds !== null && (
              <span className="absolute top-1.5 right-1 w-2 h-2 bg-amber-400 rounded-full border border-black" />
            )}
          </button>
        </header>

        {/* Tabs Switch: ĐĨA NHẠC | LỜI BÀI HÁT */}
        <div className="relative z-10 flex items-center justify-center gap-6 pt-2 text-xs font-bold shrink-0">
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

        {/* Center View - Requirement 17: Ảnh bìa cho lui lên 1 chút */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-1 overflow-hidden min-h-0 -mt-2">
          {activeTab === 'disc' ? (
            /* Rotating Vinyl View */
            <div className="flex flex-col items-center justify-center w-full max-h-[40vh] my-auto">
              <div className="relative w-[min(62vw,240px)] h-[min(62vw,240px)] max-h-[35vh] aspect-square rounded-full bg-zinc-950 p-2 shadow-2xl border-4 border-zinc-800/60 flex items-center justify-center">
                <div className="absolute inset-2 rounded-full border border-zinc-800/80 pointer-events-none" />
                <div className="absolute inset-4 rounded-full border border-zinc-800/60 pointer-events-none" />

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
              <div className="mt-2.5 flex items-center justify-center">
                <Visualizer barCount={18} height={14} color="#9b4de0" />
              </div>
            </div>
          ) : (
            /* Synchronized Karaoke Lyrics View */
            <div
              ref={lyricsContainerRef}
              className="w-full h-full overflow-y-auto px-4 py-4 space-y-4 text-center select-none"
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

        {/* Requirement 17: Phần chia sẻ bài hát, tên bài, ca sỹ và tim bài CAO HƠN một chút so với progress bar */}
        <div className="relative z-10 px-5 mb-3 flex items-center justify-between gap-3 shrink-0">
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
            <h2 className="text-base sm:text-lg font-bold text-white truncate leading-snug">
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

        {/* Scrubber Slider - Requirement 18: Xóa badge demo 60s chấm vàng; Requirement 19: Kéo đến đâu phát đúng chỗ đấy */}
        <div className="relative z-10 px-6 shrink-0">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration > 0 ? duration : 210}
              value={displayTime}
              onPointerDown={() => setIsDragging(true)}
              onChange={(e) => {
                const val = Number(e.target.value);
                setDragTime(val);
                if (!isDragging) {
                  handleSeekCommit(val);
                }
              }}
              onPointerUp={(e) => {
                handleSeekCommit(Number((e.target as HTMLInputElement).value));
              }}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Accurate Timestamps: Fix 4:299 bug, NO DEMO 60S BADGE */}
          <div className="flex items-center justify-between text-xs text-white/50 mt-1 tabular-nums font-mono font-medium">
            <span>{formatTime(displayTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Big Playback Controls Row - Requirement 4: Tô màu nổi bật khi chọn Shuffle & Repeat */}
        <div className="relative z-10 px-6 py-2.5 flex items-center justify-between max-w-sm mx-auto w-full shrink-0">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-all ${
              isShuffle
                ? 'bg-[#9b4de0] text-white shadow-lg shadow-purple-500/40 ring-2 ring-purple-400/50 scale-105'
                : 'text-white/50 hover:text-white'
            }`}
            title="Phát ngẫu nhiên"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button onClick={prevSong} className="p-2 text-white/80 active:scale-95">
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-[#9b4de0] hover:bg-[#8539c9] text-white flex items-center justify-center shadow-xl shadow-[#9b4de0]/40 active:scale-95 transition-transform"
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
            className={`p-2 rounded-full transition-all ${
              repeatMode !== 'off'
                ? 'bg-[#9b4de0] text-white shadow-lg shadow-purple-500/40 ring-2 ring-purple-400/50 scale-105'
                : 'text-white/50 hover:text-white'
            }`}
            title="Lặp lại"
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-5 h-5" />
            ) : (
              <Repeat className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Bottom Features Row */}
        <footer className="relative z-10 px-5 pb-5 pt-2 flex items-center justify-between text-xs text-white/70 border-t border-white/5 shrink-0">
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors active:scale-95"
            title="Đổi giao diện"
          >
            <Palette className="w-5 h-5" />
          </button>

          <button
            onClick={() => openAddToPlaylistModal(currentSong)}
            className="p-2 rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors active:scale-95"
            title="Thêm vào playlist"
          >
            <ListPlus className="w-5 h-5" />
          </button>

          {/* MP3 & WAV Format Switch */}
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
            >
              WAV
            </button>
          </div>

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
            title={isSongPurchased(currentSong.id) ? "Tải về máy" : "Mua & Tải về"}
          >
            <Download className="w-5 h-5" />
          </button>

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
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer"
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

      {/* Requirement 20: 3-dots Action Sheet with all 9 options */}
      <MobilePlayerActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        song={currentSong}
      />
    </>
  );
};
