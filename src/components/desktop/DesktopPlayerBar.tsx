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
import { ArtistNames } from '../common/ArtistNames';

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
      className="h-24 px-6 border-t glass-bar text-white grid grid-cols-[280px_1fr_280px] xl:grid-cols-[320px_1fr_320px] items-center select-none z-30 sticky bottom-0 transition-colors duration-200"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-player) 86%, transparent)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Left: Song Info + Static Cover (No Rotation) with Ambient Aura */}
      <div className="flex items-center gap-3.5 w-full min-w-0 pr-2">
        <div className="relative shrink-0">
          {isPlaying && currentSong && (
            <div
              className="absolute -inset-1.5 rounded-2xl blur-md opacity-45 pointer-events-none transition-opacity duration-500"
              style={{ backgroundColor: 'var(--color-accent)' }}
            />
          )}
          <div className="relative w-14 h-14 rounded-2xl bg-zinc-950/90 border border-white/15 p-0.5 flex items-center justify-center shrink-0 shadow-xl overflow-hidden">
            {currentSong?.coverImage ? (
              <img
                src={currentSong.coverImage}
                alt={currentSong.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded-[13px]"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : null}
            <div
              className={`w-full h-full rounded-[13px] bg-gradient-to-tr ${
                currentSong?.coverGradient || 'from-purple-600 to-indigo-800'
              } flex items-center justify-center overflow-hidden ${currentSong?.coverImage ? 'absolute inset-0 -z-10' : ''}`}
            />
          </div>
        </div>

        {/* Dynamic Hugging Song Info & Heart - hugs title and flexes with text */}
        <div className="inline-flex items-center gap-2.5 min-w-0 max-w-[210px] xl:max-w-[250px]">
          <div className="min-w-0 shrink truncate">
            {currentSong ? (
              <>
                <p
                  className="text-[14px] font-bold text-white hover:text-[var(--color-accent)] cursor-pointer transition-colors leading-snug truncate"
                  title={currentSong.title}
                >
                  {currentSong.title}
                </p>
                <div className="text-xs text-white/60 mt-0.5 truncate" title={currentSong.artists}>
                  <ArtistNames artists={currentSong.artists} linkClassName="text-white/60 hover:text-white" />
                </div>
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
              className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-red-400 active:scale-90 transition-all shrink-0 cursor-pointer"
              title={isLiked ? 'Bỏ thích' : 'Thêm vào yêu thích'}
            >
              <Heart
                className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isLiked ? 'text-red-500 fill-red-500' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Center: Playback Controls & Scrubber with glass-track and glass-fill */}
      <div className="w-full max-w-2xl px-4 mx-auto flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-5">
          <button
            onClick={toggleShuffle}
            style={isShuffle ? { color: 'var(--color-accent)', filter: 'drop-shadow(0 0 8px var(--color-accent))' } : {}}
            className={`p-2 rounded-full hover:bg-white/[0.06] transition-all active:scale-95 cursor-pointer ${
              isShuffle ? '' : 'text-white/60 hover:text-white'
            }`}
            title={isShuffle ? 'Đang bật phát ngẫu nhiên (Bấm để tắt)' : 'Bật phát ngẫu nhiên'}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={prevSong}
            className="p-2 rounded-full hover:bg-white/[0.08] text-white/80 hover:text-white transition-all active:scale-90 cursor-pointer"
            title="Bài trước"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full text-white flex items-center justify-center accent-glow-btn transition-all active:scale-95 cursor-pointer"
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
            className="p-2 rounded-full hover:bg-white/[0.08] text-white/80 hover:text-white transition-all active:scale-90 cursor-pointer"
            title="Bài tiếp theo"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            style={repeatMode !== 'off' ? { color: 'var(--color-accent)', filter: 'drop-shadow(0 0 8px var(--color-accent))' } : {}}
            className={`p-2 rounded-full hover:bg-white/[0.06] transition-all active:scale-95 cursor-pointer ${
              repeatMode !== 'off' ? '' : 'text-white/60 hover:text-white'
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

        {/* Progress Bar & Timestamps on single line */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-medium text-white/65 font-mono tabular-nums select-none min-w-[38px] text-right">
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
            <div className="w-full h-1.5 rounded-full glass-track overflow-visible relative">
              <div
                className={`h-full rounded-full glass-fill relative ${isDraggingProgress ? '' : 'transition-[width] duration-100 ease-linear'}`}
                style={{ width: `${progressPercent}%` }}
              >
                <span className="w-3 h-3 rounded-full bg-white shadow-md absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>
          </div>
          <span className="text-[11px] font-medium text-white/65 font-mono tabular-nums select-none min-w-[38px] text-left">
            {formatTime(safeDuration)}
          </span>
        </div>
      </div>

      {/* Right: Microphone icon, Volume with glass-track & glass-fill, Queue Drawer */}
      <div className="flex items-center justify-end gap-2.5 w-full shrink-0">
        <button
          onClick={() => setIsLyricsOpen(true)}
          className="p-2.5 rounded-full hover:bg-white/[0.08] text-white/70 hover:text-[var(--color-accent)] transition-colors cursor-pointer"
          title="Xem lời bài hát & Karaoke"
        >
          <Mic2 className="w-4.5 h-4.5" />
        </button>

        {/* Volume Scrubber */}
        <div className="flex items-center gap-2 px-1.5">
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-full hover:bg-white/[0.08] text-white/70 hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-white/80" />
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
            <div className="w-full h-1.5 group-hover:h-2 transition-all rounded-full glass-track overflow-visible relative">
              <div
                className="h-full rounded-full glass-fill relative"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white shadow-md absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-white/55 w-7 text-right select-none tabular-nums">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>

        <div className="h-6 w-px bg-white/10 mx-0.5" />

        {/* Queue Drawer Button */}
        <button
          onClick={() => setIsQueueDrawerOpen(!isQueueDrawerOpen)}
          style={isQueueDrawerOpen ? { backgroundColor: 'var(--color-accent)' } : undefined}
          className={`p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
            isQueueDrawerOpen
              ? 'text-white border-white/20 shadow-lg'
              : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/[0.09] text-white/80 hover:text-white'
          }`}
          title="Danh sách phát"
        >
          <ListMusic className="w-4 h-4" />
        </button>
      </div>
    </footer>
  );
};
