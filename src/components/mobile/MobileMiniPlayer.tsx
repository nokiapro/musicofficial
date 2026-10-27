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
  } = useMusic();

  if (!currentSong) return null;

  const isLiked = likedSongIds.includes(currentSong.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      onClick={() => setIsMobileFullPlayerOpen(true)}
      className="fixed bottom-14 left-0 right-0 z-30 bg-[#231b2e]/95 backdrop-blur-md border-t border-white/10 px-3 py-2 cursor-pointer select-none max-w-md mx-auto"
    >
      {/* Top thin progress bar */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-[#9b4de0] to-[#c273ed] transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Left: Spinning Disc + Song info */}
        <div className="flex items-center gap-3 truncate flex-1">
          <div className="relative w-10 h-10 rounded-full bg-zinc-950 border border-zinc-700 p-0.5 flex items-center justify-center shrink-0 shadow">
            <div
              className={`w-full h-full rounded-full bg-gradient-to-tr ${
                currentSong.coverGradient
              } flex items-center justify-center overflow-hidden animate-spin-slow ${
                !isPlaying ? 'paused' : ''
              }`}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-[#231b2e]" />
            </div>
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
