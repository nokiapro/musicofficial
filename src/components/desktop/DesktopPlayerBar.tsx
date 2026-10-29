import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Volume2,
  VolumeX,
  ListMusic,
  Mic2,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const DesktopPlayerBar: React.FC = () => {
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
    volume,
    setVolume,
    isMuted,
    toggleMute,
    setIsLyricsOpen,
    isQueueDrawerOpen,
    setIsQueueDrawerOpen,
    isSongPurchased,
  } = useMusic();

  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);

  const isLiked = currentSong ? likedSongIds.includes(currentSong.id) : false;
  const isPurchased = currentSong ? isSongPurchased(currentSong.id) : false;

  const displayTime = isDragging && dragTime !== null ? dragTime : currentTime;

  const formatTime = (rawSecs: number) => {
    if (isNaN(rawSecs) || !isFinite(rawSecs) || rawSecs < 0) return '0:00';
    const totalSecs = Math.floor(rawSecs);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSeekCommit = (targetVal: number) => {
    seekTo(targetVal);
    setIsDragging(false);
    setDragTime(null);
  };

  return (
    <footer
      className="h-24 px-6 border-t text-white flex items-center justify-between select-none z-30 sticky bottom-0 transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-player)', borderColor: 'var(--border-color)' }}
    >
      {/* Left: Song Info + Vinyl CD + Full Title */}
      <div className="flex items-center gap-4 w-80 shrink-0">
        {/* Spinning Vinyl Cover */}
        <div className="relative w-14 h-14 rounded-full bg-zinc-900 border-2 border-zinc-700 p-0.5 flex items-center justify-center shrink-0 shadow-lg overflow-hidden">
          {currentSong?.coverImage ? (
            <img
              src={currentSong.coverImage}
              alt={currentSong.title}
              className={`w-full h-full object-cover rounded-full animate-spin-slow ${!isPlaying ? 'paused' : ''}`}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : null}
          <div
            className={`w-full h-full rounded-full bg-gradient-to-tr ${
              currentSong?.coverGradient || 'from-purple-600 to-indigo-800'
            } flex items-center justify-center overflow-hidden animate-spin-slow ${
              !isPlaying ? 'paused' : ''
            } ${currentSong?.coverImage ? 'absolute inset-0 -z-10' : ''}`}
          />
        </div>

        {/* Title & Artist */}
        <div className="flex-1 min-w-0 pr-1">
          {currentSong ? (
            <>
              <p
                className="text-sm font-bold hover:text-[#c273ed] cursor-pointer transition-colors leading-snug break-words"
                title={currentSong.title}
              >
                {currentSong.title}
              </p>
              <p className="text-xs text-white/60 hover:text-white cursor-pointer mt-0.5 truncate">
                {currentSong.artists}
              </p>
            </>
          ) : (
            <div>
              <p className="text-sm font-bold text-white/40">Chưa chọn bài hát</p>
              <p className="text-xs text-white/30 mt-0.5">Chọn bài từ danh sách để phát</p>
            </div>
          )}
        </div>

        {/* Action: Heart icon only */}
        {currentSong && (
          <div className="flex items-center shrink-0">
            <button
              onClick={() => toggleLike(currentSong.id)}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-red-400 transition-colors"
              title={isLiked ? 'Bỏ thích' : 'Thêm vào yêu thích'}
            >
              <Heart
                className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : ''}`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Center: Playback Controls & Scrubber */}
      <div className="flex-1 max-w-2xl px-6 flex flex-col items-center gap-1.5">
        {/* Buttons Row */}
        <div className="flex items-center gap-5">
          {/* Requirement 4: Nút phát ngẫu nhiên tô màu nổi bật khi được chọn */}
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-all ${
              isShuffle
                ? 'bg-[#9b4de0] text-white shadow-lg shadow-purple-500/40 ring-2 ring-purple-400/50 scale-105'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title={isShuffle ? 'Đang bật phát ngẫu nhiên (Bấm để tắt)' : 'Bật phát ngẫu nhiên'}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={prevSong}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Bài trước"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            style={{ backgroundColor: 'var(--color-accent)' }}
            className="w-11 h-11 rounded-full text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 hover:opacity-90"
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={nextSong}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
            title="Bài tiếp theo"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          {/* Requirement 4: Nút lặp lại tô màu nổi bật khi được chọn */}
          <button
            onClick={toggleRepeat}
            className={`p-2 rounded-full transition-all ${
              repeatMode !== 'off'
                ? 'bg-[#9b4de0] text-white shadow-lg shadow-purple-500/40 ring-2 ring-purple-400/50 scale-105'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
            title={`Lặp lại: ${
              repeatMode === 'off'
                ? 'Tắt'
                : repeatMode === 'all'
                ? 'Tất cả bài'
                : 'Lặp lại 1 bài'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Progress Bar & Timestamps (Requirement 3: no thumb, Requirement 19: drag to seek) */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs text-white/50 tabular-nums w-10 text-right">
            {formatTime(displayTime)}
          </span>
          <div className="relative flex-1 flex items-center group">
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
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer group-hover:h-2 transition-all no-thumb"
            />
            {/* Visual demo indicator mark & yellow dot at 60s if not purchased */}
            {!isPurchased && duration > 60 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -ml-1.5 flex flex-col items-center pointer-events-none z-10"
                style={{ left: `${(60 / duration) * 100}%` }}
                title="Chấm vàng: Hết hạn nghe thử 60s"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#170f23] shadow-[0_0_8px_#f59e0b]" />
              </div>
            )}
          </div>
          <span className="text-xs text-white/50 tabular-nums w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Microphone icon, Volume, Queue Drawer */}
      <div className="flex items-center justify-end gap-3 w-80 shrink-0">
        <button
          onClick={() => setIsLyricsOpen(true)}
          className="p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-[#c273ed] transition-colors"
          title="Xem lời bài hát & Karaoke"
        >
          <Mic2 className="w-5 h-5" />
        </button>

        {/* Volume - Requirement 3: Bỏ thumb tròn của âm lượng */}
        <div className="flex items-center gap-1.5 px-2">
          <button
            onClick={toggleMute}
            className="p-1 rounded-full text-white/70 hover:text-white transition-colors"
            title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-purple-300" />
            )}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer no-thumb"
            title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
          <span className="text-[10px] font-mono font-bold text-white/60 w-7 text-right">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>

        <div className="h-6 w-px bg-white/10 mx-1" />

        {/* Queue Drawer Button */}
        <button
          onClick={() => setIsQueueDrawerOpen(!isQueueDrawerOpen)}
          className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
            isQueueDrawerOpen
              ? 'bg-[#9b4de0] text-white'
              : 'bg-white/10 hover:bg-white/15 text-white/80 hover:text-white'
          }`}
          title="Danh sách phát"
        >
          <ListMusic className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
