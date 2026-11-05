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
      className="fixed left-0 right-0 z-30 backdrop-blur-xl border-t px-3.5 py-2 cursor-pointer select-none max-w-md mx-auto transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
        bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Bottom thin progress bar with accent color matching Screenshot 3 */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out shadow-[0_0_6px_var(--color-accent)]"
          style={{ width: `${progressPercent}%`, backgroundColor: 'var(--color-accent)' }}
        />
        {!isPurchased && duration > 60 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b] -ml-1 pointer-events-none"
            style={{ left: `${(60 / duration) * 100}%` }}
            title="Chấm vàng: Hết hạn nghe thử 60s"
          />
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Left: Rounded Square Cover with Sliding Vinyl Disc behind it (Matching Screenshot 3) */}
        <div className="flex items-center gap-3 truncate flex-1 min-w-0">
          <div className="relative flex items-center shrink-0 pr-3">
            {/* The Vinyl Disc sliding out from behind the cover without drop shadows */}
            <div
              className={`absolute left-0.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-zinc-950 border-2 transition-all duration-500 ease-out z-0 overflow-hidden ${
                isPlaying
                  ? 'translate-x-4 border-[var(--color-accent)] ring-1 ring-white/40'
                  : 'translate-x-0 border-zinc-800'
              }`}
            >
              <div
                style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                className="w-full h-full rounded-full flex items-center justify-center animate-spin-slow relative"
              >
                {/* Rotating specular light sheen for visible spinning vinyl effect */}
                <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.45)_90deg,transparent_180deg,rgba(255,255,255,0.45)_270deg,transparent_360deg)] pointer-events-none opacity-80" />
                {/* Light ring without drop shadow */}
                <div className="absolute inset-0.5 rounded-full border border-white/60 pointer-events-none" />
                <div className="absolute inset-1.5 rounded-full border border-zinc-700" />
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 border border-white/60 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-zinc-950" />
                </div>
              </div>
            </div>

            {/* Front Cover Image with rounded 4 corners (bo cong 4 góc) */}
            <div className="relative z-10 w-11 h-11 rounded-xl overflow-hidden shadow-lg border border-white/15 bg-zinc-900 shrink-0">
              {currentSong.coverImage ? (
                <img
                  src={currentSong.coverImage}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : null}
              <div
                className={`w-full h-full bg-gradient-to-tr ${
                  currentSong.coverGradient || 'from-purple-600 to-indigo-800'
                } flex items-center justify-center ${currentSong.coverImage ? 'absolute inset-0 -z-10' : ''}`}
              />
            </div>
          </div>

          {/* Song title and artist */}
          <div className="truncate min-w-0">
            <p className="text-xs sm:text-sm font-bold text-[var(--text-primary)] truncate leading-tight">{currentSong.title}</p>
            <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">{currentSong.artists}</p>
          </div>
        </div>

        {/* Right Controls matching Screenshot 3: Heart, large clean Play/Pause, Next */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(currentSong.id);
            }}
            className="p-1.5 text-white/70 hover:text-red-400 active:scale-90 transition-transform cursor-pointer"
            aria-label="Thả tim"
          >
            <Heart
              className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : 'text-white/80'}`}
            />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="p-1.5 text-white hover:opacity-85 active:scale-90 transition-transform cursor-pointer"
            aria-label={isPlaying ? 'Tạm dừng' : 'Phát tiếp'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              nextSong();
            }}
            className="p-1.5 text-white/80 hover:text-white active:scale-90 transition-transform cursor-pointer"
            aria-label="Bài tiếp theo"
          >
            <SkipForward className="w-5 h-5 fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
