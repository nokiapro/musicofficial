import React, { useState, useRef } from 'react';
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
  } = useMusic();

  const progressTrackRef = useRef<HTMLDivElement | null>(null);
  const volumeTrackRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [dragProgressTime, setDragProgressTime] = useState<number | null>(null);

  const isLiked = currentSong ? likedSongIds.includes(currentSong.id) : false;

  const safeDuration = Math.max(1, duration || 210);
  const displayProgressTime = isDraggingProgress && dragProgressTime !== null ? dragProgressTime : currentTime;
  const progressPercent = Math.min(100, Math.max(0, (displayProgressTime / safeDuration) * 100));

  const formatTime = (rawSecs: number) => {
    if (isNaN(rawSecs) || !isFinite(rawSecs) || rawSecs < 0) return '00:00';
    const totalSecs = Math.floor(rawSecs);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Interactive seek drag & click on progress track
  const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!progressTrackRef.current) return;
    setIsDraggingProgress(true);

    const calcTime = (clientX: number) => {
      if (!progressTrackRef.current) return 0;
      const rect = progressTrackRef.current.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return pct * safeDuration;
    };

    const targetTime = calcTime(e.clientX);
    setDragProgressTime(targetTime);

    const onMove = (moveEv: PointerEvent) => {
      const t = calcTime(moveEv.clientX);
      setDragProgressTime(t);
    };

    const onUp = (upEv: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const finalT = calcTime(upEv.clientX);
      seekTo(finalT);
      setIsDraggingProgress(false);
      setDragProgressTime(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  // Interactive volume drag & click on volume track
  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!volumeTrackRef.current) return;

    const calcVol = (clientX: number) => {
      if (!volumeTrackRef.current) return 0;
      const rect = volumeTrackRef.current.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return pct;
    };

    const newV = calcVol(e.clientX);
    setVolume(newV);
    if (isMuted && newV > 0) toggleMute();

    const onMove = (moveEv: PointerEvent) => {
      const v = calcVol(moveEv.clientX);
      setVolume(v);
      if (isMuted && v > 0) toggleMute();
    };

    const onUp = (upEv: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const finalV = calcVol(upEv.clientX);
      setVolume(finalV);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  return (
    <footer
      className="h-24 px-6 border-t text-white flex items-center justify-between select-none z-30 sticky bottom-0 transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-player)', borderColor: 'var(--border-color)' }}
    >
      {/* Left: Song Info + Vinyl CD + Full Title with Dynamic Hugging Heart (Requirement 8) */}
      <div className="flex items-center gap-3.5 max-w-[340px] shrink-0">
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

        {/* Dynamic Hugging Song Info & Heart: moves closer or farther based on title width */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0 max-w-[200px]">
            {currentSong ? (
              <>
                <p
                  className="text-sm font-bold text-white hover:text-[#c273ed] cursor-pointer transition-colors leading-snug truncate"
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
                <p className="text-xs text-white/30 mt-0.5">Chọn bài để phát</p>
              </div>
            )}
          </div>

          {/* Action: Heart icon hugging immediately next to song text */}
          {currentSong && (
            <button
              onClick={() => toggleLike(currentSong.id)}
              className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-red-400 active:scale-90 transition-all shrink-0"
              title={isLiked ? 'Bỏ thích' : 'Thêm vào yêu thích'}
            >
              <Heart
                className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'text-red-500 fill-red-500' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Center: Playback Controls & Scrubber with glass-track and glass-fill */}
      <div className="flex-1 max-w-2xl px-6 flex flex-col items-center gap-1.5">
        {/* Buttons Row - Requirement 4: Active state glows icon only, without button background box */}
        <div className="flex items-center gap-5">
          <button
            onClick={toggleShuffle}
            className={`p-2 transition-all active:scale-95 ${
              isShuffle
                ? 'text-[#c273ed] drop-shadow-[0_0_8px_rgba(194,115,237,0.9)]'
                : 'text-white/60 hover:text-white'
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

          <button
            onClick={toggleRepeat}
            className={`p-2 transition-all active:scale-95 ${
              repeatMode !== 'off'
                ? 'text-[#c273ed] drop-shadow-[0_0_8px_rgba(194,115,237,0.9)]'
                : 'text-white/60 hover:text-white'
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

        {/* Requirement 4: Progress Bar & Timestamps on SAME SINGLE LINE with glass-track and glass-fill */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs text-white/70 font-mono tabular-nums select-none min-w-[38px] text-right">
            {formatTime(displayProgressTime)}
          </span>
          <div
            ref={progressTrackRef}
            onPointerDown={handleProgressPointerDown}
            className="relative flex-1 py-2 cursor-pointer group flex items-center"
            role="slider"
            aria-valuemin={0}
            aria-valuemax={safeDuration}
            aria-valuenow={displayProgressTime}
          >
            <div className="w-full h-1.5 group-hover:h-2.5 rounded-full glass-track overflow-hidden relative shadow-inner">
              <div
                className={`h-full glass-fill ${isDraggingProgress ? '' : 'transition-[width] duration-150 ease-out'} shadow-[0_0_8px_rgba(255,255,255,0.4)]`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-white/70 font-mono tabular-nums select-none min-w-[38px] text-left">
            {formatTime(safeDuration)}
          </span>
        </div>
      </div>

      {/* Right: Microphone icon, Volume with glass-track & glass-fill, Queue Drawer */}
      <div className="flex items-center justify-end gap-3 w-80 shrink-0">
        <button
          onClick={() => setIsLyricsOpen(true)}
          className="p-2.5 rounded-full hover:bg-white/10 text-white/70 hover:text-[#c273ed] transition-colors"
          title="Xem lời bài hát & Karaoke"
        >
          <Mic2 className="w-5 h-5" />
        </button>

        {/* Volume Scrubber with glass-track and glass-fill (Requirement 4) */}
        <div className="flex items-center gap-2 px-2">
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
          <div
            ref={volumeTrackRef}
            onPointerDown={handleVolumePointerDown}
            className="w-20 sm:w-24 py-2 cursor-pointer group flex items-center"
            title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
          >
            <div className="w-full h-1.5 rounded-full glass-track overflow-hidden relative shadow-inner">
              <div
                className="h-full glass-fill"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-white/60 w-7 text-right select-none">
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
