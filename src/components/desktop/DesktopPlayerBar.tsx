import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  FileText,
  Volume2,
  VolumeX,
  ListMusic,
  Tv,
  ShoppingCart,
  CheckCircle,
  Share2,
  ListPlus,
  Download,
  Gauge,
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
    setSelectedLrcSong,
    isQueueDrawerOpen,
    setIsQueueDrawerOpen,
    isSongPurchased,
    setSongToBuy,
    setIsBuyModalOpen,
    openShareModal,
    openAddToPlaylistModal,
    downloadSong,
  } = useMusic();

  const isLiked = currentSong ? likedSongIds.includes(currentSong.id) : false;
  const isPurchased = currentSong ? isSongPurchased(currentSong.id) : false;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <footer
      className="h-24 px-6 border-t text-white flex items-center justify-between select-none z-30 sticky bottom-0 transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-player)', borderColor: 'var(--border-color)' }}
    >
      {/* Left: Song Info + Vinyl CD + Format badge & Purchase status */}
      <div className="flex items-center gap-4 w-80 shrink-0">
        {/* Spinning Vinyl Cover with Cover Image support */}
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
          >
            <div className="w-4 h-4 rounded-full bg-[var(--bg-player)] border border-zinc-800" />
          </div>
        </div>

        {/* Title, Artist, Audio Format and License Tag */}
        <div className="flex-1 truncate">
          {currentSong ? (
            <>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold truncate hover:text-[#c273ed] cursor-pointer transition-colors">
                  {currentSong.title}
                </p>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                    currentSong.audioFormat === 'WAV'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {currentSong.audioFormat}
                </span>
              </div>
              <p className="text-xs text-white/60 truncate hover:text-white cursor-pointer mt-0.5">
                {currentSong.artists}
              </p>
              <div className="mt-0.5">
                {isPurchased ? (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Đã mua • Bản quyền Full
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setSongToBuy(currentSong);
                      setIsBuyModalOpen(true);
                    }}
                    className="text-[10px] text-amber-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Demo 60s • Mua ({currentSong.price.toLocaleString('vi-VN')}đ)</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm font-bold text-white/40">Chưa chọn bài hát</p>
              <p className="text-xs text-white/30 mt-0.5">Chọn bài từ danh sách để phát</p>
            </div>
          )}
        </div>

        {/* Action icons */}
        {currentSong && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleLike(currentSong.id)}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-red-400 transition-colors"
              title={isLiked ? 'Bỏ thích' : 'Thêm vào yêu thích'}
            >
              <Heart
                className={`w-4 h-4 ${isLiked ? 'text-red-500 fill-red-500' : ''}`}
              />
            </button>
            <button
              onClick={() => setSelectedLrcSong(currentSong)}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-[#c273ed] transition-colors"
              title="Xem tệp LRC lời bài hát"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => openAddToPlaylistModal(currentSong)}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="Thêm vào playlist cá nhân"
            >
              <ListPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => openShareModal(currentSong)}
              className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
              title="Chia sẻ bài hát (Deep link)"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {isSongPurchased(currentSong.id) && (
              <button
                onClick={() => downloadSong(currentSong, currentSong.audioFormat)}
                className="p-2 rounded-full hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors"
                title={`Tải file ${currentSong.audioFormat} bản quyền về máy`}
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Center: Playback Controls & Scrubber */}
      <div className="flex-1 max-w-2xl px-6 flex flex-col items-center gap-1.5">
        {/* Buttons Row */}
        <div className="flex items-center gap-5">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
              isShuffle ? 'text-[#c273ed]' : 'text-white/60 hover:text-white'
            }`}
            title={isShuffle ? 'Tắt phát ngẫu nhiên' : 'Bật phát ngẫu nhiên'}
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
            className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${
              repeatMode !== 'off'
                ? 'text-[#c273ed]'
                : 'text-white/60 hover:text-white'
            }`}
            title={`Lặp lại: ${
              repeatMode === 'off'
                ? 'Tắt'
                : repeatMode === 'all'
                ? 'Tất cả'
                : '1 bài'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Progress Bar & Timestamps */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs text-white/50 tabular-nums w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center group">
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer group-hover:h-1.5 transition-all"
            />
            {/* Visual demo indicator mark & yellow dot at 60s if not purchased */}
            {!isPurchased && duration > 60 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -ml-1.5 flex flex-col items-center pointer-events-none z-10"
                style={{ left: `${(60 / duration) * 100}%` }}
                title="Chấm vàng: Hết hạn nghe thử 60s - Yêu cầu mua để nghe full bài"
              >
                <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-[#170f23] shadow-[0_0_8px_#f59e0b]" />
                <div className="w-0.5 h-2 bg-amber-400/80 -mt-0.5" />
              </div>
            )}
          </div>
          <span className="text-xs text-white/50 tabular-nums w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: MV, Lyrics, Volume, Queue Drawer */}
      <div className="flex items-center justify-end gap-2 w-80 shrink-0">
        <button
          onClick={() => setIsLyricsOpen(true)}
          className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-[#c273ed] transition-colors font-bold text-xs flex items-center gap-1"
          title="Xem lời bài hát Karaoke"
        >
          <span>KARAOKE</span>
        </button>

        {/* Volume - Always default 100% with indicator */}
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
            className="w-20 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
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
