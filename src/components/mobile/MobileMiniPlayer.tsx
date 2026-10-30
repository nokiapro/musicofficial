import React from 'react';
import { Play, Pause, SkipForward, Heart } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const MobileMiniPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    nextSong,
    likedSongIds,
    toggleLike,
    setIsMobileFullPlayerOpen,
    isSongPurchased,
  } = useMusic();

  if (!currentSong) return null;

  const isLiked = likedSongIds.includes(currentSong.id);
  const isPurchased = isSongPurchased(currentSong.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={() => setIsMobileFullPlayerOpen(true)}
      className="fixed left-0 right-0 z-30 backdrop-blur-md border-t px-3 py-2 cursor-pointer select-none max-w-md mx-auto transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Top thin progress bar with yellow 60s marker */}
      <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-white/15 overflow-hidden">
        <div
          className="h-full bg-white rounded-full transition-[width] duration-300 ease-out shadow-[0_0_6px_rgba(255,255,255,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
        {!isPurchased && duration > 60 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] -ml-1 pointer-events-none"
            style={{ left: `${(60 / duration) * 100}%` }}
            title="Chấm vàng: Hết hạn nghe thử 60s"
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Left: Spinning Disc + Song info */}
        <div className="flex items-center gap-3 truncate flex-1">
          <div className="relative w-10 h-10 rounded-full bg-zinc-950 border border-zinc-700 p-0.5 flex items-center justify-center shrink-0 shadow overflow-hidden">
            {currentSong.coverImage ? (
              <img
                src={currentSong.coverImage}
                alt={currentSong.title}
                className={`w-full h-full object-cover rounded-full animate-spin-slow ${!isPlaying ? 'paused' : ''}`}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : null}
            <div
              className={`w-full h-full rounded-full bg-gradient-to-tr ${
                currentSong.coverGradient || 'from-purple-600 to-indigo-800'
              } flex items-center justify-center overflow-hidden animate-spin-slow ${
                !isPlaying ? 'paused' : ''
              } ${currentSong.coverImage ? 'absolute inset-0 -z-10' : ''}`}
            />
          </div>

          <div className="truncate">
            <p className="text-xs font-bold text-white truncate">{currentSong.title}</p>
            <p className="text-[10px] text-white/60 truncate">{currentSong.artists}</p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(currentSong.id);
            }}
            className="p-2 text-white/60 hover:text-red-400"
          >
            <Heart
              className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-red-500' : ''}`}
            />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-8 h-8 rounded-full bg-[#9b4de0] text-white flex items-center justify-center shadow"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSong();
            }}
            className="p-2 text-white/70 hover:text-white"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
