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
  Mic2,
  ListMusic,
  Disc3,
  Sparkles,
  Share2,
  ListPlus,
  Download,
  Gauge,
  ShoppingCart,
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
    downloadSong,
    setIsAudioSettingsModalOpen,
    setSongToBuy,
    setIsBuyModalOpen,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'disc' | 'lyrics'>('disc');
  const [showQueueSheet, setShowQueueSheet] = useState(false);
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  if (!isMobileFullPlayerOpen || !currentSong) return null;

  const isLiked = likedSongIds.includes(currentSong.id);
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
      <header className="relative z-10 px-4 py-3 flex items-center justify-between border-b border-white/5">
        <button
          onClick={() => setIsMobileFullPlayerOpen(false)}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/80"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center truncate px-4">
          <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">
            Đang phát từ Playlist
          </p>
          <p className="text-xs font-bold text-white truncate">{currentSong.album}</p>
        </div>

        <button className="p-2 -mr-2 rounded-full hover:bg-white/10 text-white/80">
          <MoreVertical className="w-5 h-5" />
        </button>
      </header>

      {/* Tabs Switch: Đĩa nhạc | Lời bài hát */}
      <div className="relative z-10 flex items-center justify-center gap-6 pt-3 text-xs font-bold">
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
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
        {activeTab === 'disc' ? (
          /* Rotating Vinyl View */
          <div className="flex flex-col items-center justify-center w-full">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-zinc-950 p-3 shadow-2xl border-4 border-zinc-800/60 flex items-center justify-center">
              {/* Outer Grooves */}
              <div className="absolute inset-2 rounded-full border border-zinc-800/80 pointer-events-none" />
              <div className="absolute inset-5 rounded-full border border-zinc-800/60 pointer-events-none" />

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
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null}
                <div className="absolute w-20 h-20 rounded-full bg-[#120822] border-4 border-zinc-900 flex items-center justify-center shadow-lg">
                  <Disc3 className="w-8 h-8 text-white/70" />
                </div>
              </div>

              {/* Spindle Pin */}
              <div className="absolute w-5 h-5 rounded-full bg-zinc-300 border-2 border-zinc-900 shadow" />
            </div>

            {/* Sound Wave Spectrum */}
            <div className="mt-6 flex items-center justify-center">
              <Visualizer barCount={18} height={18} color="#9b4de0" />
            </div>
          </div>
        ) : (
          /* Synchronized Karaoke Lyrics View */
          <div
            ref={lyricsContainerRef}
            className="w-full h-full overflow-y-auto px-4 py-8 space-y-5 text-center select-none"
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
                      ? 'text-xl text-amber-300 scale-105 drop-shadow-[0_2px_12px_rgba(251,191,36,0.6)]'
                      : isPast
                      ? 'text-sm text-white/40'
                      : 'text-sm text-white/60'
                  }`}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        )}
      </main>

      {/* Song Info Bar */}
      <div className="relative z-10 px-6 flex items-center justify-between">
        <div className="truncate mr-4 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white truncate">{currentSong.title}</h2>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase shrink-0 ${
                currentSong.audioFormat === 'WAV'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {currentSong.audioFormat}
            </span>
          </div>
          <p className="text-xs text-white/60 truncate mt-0.5">{currentSong.artists}</p>
        </div>

        <button
          onClick={() => toggleLike(currentSong.id)}
          className="p-2 text-white/70 hover:text-red-400 active:scale-95 transition-transform shrink-0"
        >
          <Heart
            className={`w-6 h-6 ${isLiked ? 'text-red-500 fill-red-500' : ''}`}
          />
        </button>
      </div>

      {/* Quick Feature Action Bar: Add to Playlist, Share, Download/Buy */}
      <div className="relative z-10 px-6 mt-2 flex items-center justify-end gap-2">
        <div className="flex items-center gap-2">
          {/* Add to Playlist */}
          <button
            onClick={() => openAddToPlaylistModal(currentSong)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white/70 hover:text-white active:scale-95 transition-all"
            title="Thêm vào playlist"
          >
            <ListPlus className="w-4 h-4" />
          </button>

          {/* Share Deep Link */}
          <button
            onClick={() => openShareModal(currentSong)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/15 text-white/70 hover:text-white active:scale-95 transition-all"
            title="Chia sẻ bài hát trực tiếp"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Download if purchased, or Buy Button */}
          {isSongPurchased(currentSong.id) ? (
            <button
              onClick={() => downloadSong(currentSong, currentSong.audioFormat)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold active:scale-95 transition-all"
              title="Tải nhạc bản quyền về máy"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Full</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setSongToBuy(currentSong);
                setIsBuyModalOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow-md active:scale-95 transition-all"
              title="Mua nhạc bản quyền"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Mua ({(currentSong.price ?? 20000).toLocaleString('vi-VN')}đ)</span>
            </button>
          )}
        </div>
      </div>

      {/* Scrubber Slider */}
      <div className="relative z-10 px-6 mt-4">
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
      <div className="relative z-10 px-6 py-4 flex items-center justify-between max-w-sm mx-auto w-full">
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
          className="w-16 h-16 rounded-full bg-[#9b4de0] hover:bg-[#8539c9] text-white flex items-center justify-center shadow-xl shadow-[#9b4de0]/40 active:scale-95 transition-transform"
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

      {/* Bottom Features Row: Timer, Lossless, Karaoke Mic, Queue */}
      <footer className="relative z-10 px-6 pb-6 pt-2 flex items-center justify-between text-xs text-white/60 border-t border-white/5">
        <button
          onClick={() => setIsSleepTimerModalOpen(true)}
          className={`flex items-center gap-1 p-2 rounded-lg ${
            sleepTimerRemainingSeconds !== null ? 'text-[#c273ed] font-bold' : ''
          }`}
          title="Hẹn giờ tắt"
        >
          <Clock className="w-4 h-4" />
          <span>{sleepTimerRemainingSeconds ? `${Math.ceil(sleepTimerRemainingSeconds / 60)}p` : 'Hẹn giờ'}</span>
        </button>

        <div className="px-2 py-0.5 rounded border border-white/20 text-[10px] font-bold text-white/80">
          LOSSLESS
        </div>

        <button
          onClick={() => setActiveTab(activeTab === 'lyrics' ? 'disc' : 'lyrics')}
          className={`flex items-center gap-1 p-2 rounded-lg ${
            activeTab === 'lyrics' ? 'text-amber-300 font-bold' : ''
          }`}
        >
          <Mic2 className="w-4 h-4" />
          <span>Karaoke</span>
        </button>

        <button
          onClick={() => setShowQueueSheet(true)}
          className="p-2 rounded-lg text-white/80 hover:text-white"
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
