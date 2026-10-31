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
  Download,
  Palette,
  FolderPlus,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
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
    setIsSleepTimerModalOpen,
    queue,
    playSong,
    isSongPurchased,
    openShareModal,
    setSongToBuy,
    setIsDemoLimitModalOpen,
    preferredAudioFormat,
    songFormatMap,
    setSongAudioFormat,
    openDownloadModal,
    playbackSource,
    setIsThemeModalOpen,
    openAddToPlaylistModal,
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'disc' | 'lyrics'>('disc');
  const [showQueueSheet, setShowQueueSheet] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  // Scrubber dragging state
  const scrubTrackRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);

  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Swipe gesture: swipe left for lyrics, swipe right for disc
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    const deltaY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
      if (deltaX < 0 && activeTab === 'disc') {
        setActiveTab('lyrics');
      } else if (deltaX > 0 && activeTab === 'lyrics') {
        setActiveTab('disc');
      }
    }
  };

  if (!isMobileFullPlayerOpen || !currentSong) return null;

  const isLiked = likedSongIds.includes(currentSong.id);
  const currentFormat = songFormatMap[currentSong.id] || preferredAudioFormat;
  const lyrics = currentSong.lyrics || [];
  const activeLyricIdx = lyrics.findIndex(
    (line, index) =>
      currentTime >= line.time &&
      (index === lyrics.length - 1 || currentTime < lyrics[index + 1].time)
  );

  const safeDuration = Math.max(1, duration || 210);
  const displayScrubTime = isScrubbing && scrubTime !== null ? scrubTime : currentTime;
  const scrubPercent = Math.min(100, Math.max(0, (displayScrubTime / safeDuration) * 100));

  const formatTime = (rawSecs: number | undefined | null) => {
    if (rawSecs === undefined || rawSecs === null || isNaN(rawSecs) || !isFinite(rawSecs) || rawSecs < 0) {
      return '0:00';
    }
    const totalSecs = Math.floor(rawSecs);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleScrubPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!scrubTrackRef.current) return;
    setIsScrubbing(true);

    const calcTime = (clientX: number) => {
      if (!scrubTrackRef.current) return 0;
      const rect = scrubTrackRef.current.getBoundingClientRect();
      const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      return pct * safeDuration;
    };

    const targetT = calcTime(e.clientX);
    setScrubTime(targetT);

    const onMove = (moveEv: PointerEvent) => {
      setScrubTime(calcTime(moveEv.clientX));
    };

    const onUp = (upEv: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      const finalT = calcTime(upEv.clientX);
      seekTo(finalT);
      setIsScrubbing(false);
      setScrubTime(null);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-[#2d244f] via-[#1c1836] to-[#120f24] text-white select-none animate-in slide-in-from-bottom duration-300 overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
          <div
            className={`absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[100px] bg-gradient-to-tr ${currentSong.coverGradient || 'from-purple-600 to-indigo-800'}`}
          />
          <div
            className={`absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-[100px] bg-gradient-to-br ${currentSong.coverGradient || 'from-purple-600 to-indigo-800'}`}
          />
        </div>

        {/* Top Header matching OK_14e05c73.jpg */}
        <header className="relative z-20 px-4 pt-3 pb-2 flex items-center justify-between shrink-0">
          <button
            onClick={() => setIsMobileFullPlayerOpen(false)}
            className="p-2 -ml-1 rounded-full text-white/90 active:scale-95 transition-transform"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="text-center truncate px-2">
            <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">
              PHÁT TỪ
            </p>
            <p className="text-xs font-bold text-white truncate max-w-[200px] mx-auto">
              {playbackSource || 'Bài hát gợi ý'}
            </p>
            {/* Page indicator pill and dot: click or swipe to switch */}
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <button
                onClick={() => setActiveTab('disc')}
                className={`h-1 rounded-full transition-all duration-300 ${activeTab === 'disc' ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
                aria-label="Đĩa xoay"
              />
              <button
                onClick={() => setActiveTab('lyrics')}
                className={`h-1 rounded-full transition-all duration-300 ${activeTab === 'lyrics' ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
                aria-label="Lời bài hát"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 -mr-1">
            {/* 3-dots Menu Button */}
            <button
              onClick={() => setIsActionSheetOpen(true)}
              className="p-2 text-white/80 hover:text-white active:scale-95 transition-transform relative cursor-pointer"
              title="Tùy chọn mở rộng"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Center View: Disc or Lyrics matching OK_14e05c73.jpg */}
        <main
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-2 overflow-hidden min-h-0 touch-pan-y"
        >
          {activeTab === 'disc' ? (
            /* Perfectly Circular Rotating Disc without micro icon or visualizer */
            <div className="relative flex flex-col items-center justify-center w-full my-auto animate-in fade-in duration-200">
              <div className="relative w-[min(72vw,275px)] h-[min(72vw,275px)] aspect-square rounded-full shadow-2xl relative border-2 border-white/10 flex items-center justify-center overflow-hidden">
                <div
                  style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                  className="w-full h-full rounded-full bg-gradient-to-tr from-purple-600 to-indigo-800 flex items-center justify-center overflow-hidden animate-spin-slow shadow-inner relative"
                >
                  {currentSong.coverImage ? (
                    <img
                      src={currentSong.coverImage}
                      alt={currentSong.title}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <Disc3 className="w-20 h-20 text-white/70" />
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Synchronized Karaoke Lyrics View */
            <div className="w-full h-full flex flex-col overflow-hidden relative">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Lời bài hát</span>
                <button
                  onClick={() => setActiveTab('disc')}
                  className="text-xs text-purple-300 hover:text-white font-semibold"
                >
                  Quay lại đĩa nhạc
                </button>
              </div>
              <div
                ref={lyricsContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-center select-none"
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
            </div>
          )}
        </main>

        {/* Song Info Row: Share (left) + Title & Artist (center) + Heart (right) */}
        <div className="relative z-10 px-6 mb-2 flex items-center justify-between gap-3 shrink-0">
          {/* Left: Share Icon */}
          <button
            onClick={() => openShareModal(currentSong)}
            className="p-2 text-white/70 hover:text-white active:scale-95 transition-all shrink-0"
            title="Chia sẻ bài hát"
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* Center: Title & Artist */}
          <div className="flex-1 min-w-0 text-center px-2">
            <h2 className="text-base sm:text-lg font-bold text-white truncate leading-snug">
              {currentSong.title}
            </h2>
            <p className="text-xs text-white/60 truncate mt-0.5">{currentSong.artists}</p>
          </div>

          {/* Right: Heart / Like Icon */}
          <button
            onClick={() => toggleLike(currentSong.id)}
            className="p-2 text-white/70 hover:text-red-400 active:scale-95 transition-all shrink-0"
            title="Yêu thích bài hát"
          >
            <Heart
              className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : ''}`}
            />
          </button>
        </div>

        {/* Scrubber Progress Bar matching OK_14e05c73.jpg */}
        <div className="relative z-10 px-6 mb-2 shrink-0">
          <div
            ref={scrubTrackRef}
            onPointerDown={handleScrubPointerDown}
            className="relative py-2 flex items-center cursor-pointer group"
          >
            <div className="w-full h-1 bg-white/20 rounded-full relative">
              <div
                className="h-full bg-white rounded-full relative"
                style={{ width: `${scrubPercent}%` }}
              >
                {/* Knob circle on current position */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)] -mr-1.5" />
              </div>
            </div>
          </div>

          {/* Accurate Timestamps directly below */}
          <div className="flex items-center justify-between text-xs text-white/60 mt-0.5 tabular-nums font-mono">
            <span>{formatTime(displayScrubTime)}</span>
            <span>{formatTime(safeDuration)}</span>
          </div>
        </div>

        {/* Big Playback Controls Row matching OK_14e05c73.jpg */}
        <div className="relative z-10 px-6 py-2 flex items-center justify-between max-w-sm mx-auto w-full shrink-0">
          <button
            onClick={toggleShuffle}
            className={`p-2 transition-all ${
              isShuffle ? 'text-purple-400' : 'text-white/70 hover:text-white'
            }`}
            title="Phát ngẫu nhiên"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button onClick={prevSong} className="p-2 text-white active:scale-95 transition-transform">
            <SkipBack className="w-7 h-7 fill-white" />
          </button>

          {/* White border circle Play/Pause button matching OK_14e05c73.jpg */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center text-white active:scale-95 transition-transform hover:bg-white/10 shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-1" />
            )}
          </button>

          <button onClick={nextSong} className="p-2 text-white active:scale-95 transition-transform">
            <SkipForward className="w-7 h-7 fill-white" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-2 transition-all ${
              repeatMode !== 'off' ? 'text-purple-400' : 'text-white/70 hover:text-white'
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

        {/* Bottom 5 Utility Buttons: 1: Theme, 2: Add to Playlist, 3: Quality 320Kbps/WAV, 4: Download, 5: Queue */}
        <footer className="relative z-10 px-6 pb-6 pt-2 flex items-center justify-between text-white/70 shrink-0">
          {/* 1: Theme palette changer */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="p-2 text-white/70 hover:text-white active:scale-95 transition-transform"
            title="Đổi chủ đề / Theme giao diện"
          >
            <Palette className="w-5 h-5" />
          </button>

          {/* 2: Add to Playlist */}
          <button
            onClick={() => openAddToPlaylistModal(currentSong)}
            className="p-2 text-white/70 hover:text-white active:scale-95 transition-transform"
            title="Thêm vào danh sách phát"
          >
            <FolderPlus className="w-5 h-5" />
          </button>

          {/* 3: Quality Badge in Center: 320 Kbps or WAV */}
          <button
            onClick={() => {
              const nextF = currentFormat === 'MP3' ? 'WAV' : 'MP3';
              setSongAudioFormat(currentSong.id, nextF);
              playSong(currentSong, nextF);
            }}
            className="px-3.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-[11px] font-bold text-white tracking-wider active:scale-95 transition-all"
            title="Chuyển đổi chất lượng âm thanh: 320 Kbps hoặc WAV Lossless"
          >
            {currentFormat === 'WAV' ? 'WAV' : '320 Kbps'}
          </button>

          {/* 4: Download icon */}
          <button
            onClick={() => {
              if (isSongPurchased(currentSong.id)) {
                openDownloadModal(currentSong);
              } else {
                setSongToBuy(currentSong);
                setIsDemoLimitModalOpen(true);
              }
            }}
            className="p-2 text-white/70 hover:text-white active:scale-95 transition-transform"
            title={isSongPurchased(currentSong.id) ? 'Tải về máy' : 'Mua & Tải về'}
          >
            <Download className="w-5 h-5" />
          </button>

          {/* 5: Queue / Playlist icon */}
          <button
            onClick={() => setShowQueueSheet(true)}
            className="p-2 text-white/70 hover:text-white active:scale-95 transition-transform"
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

      {/* 3-dots Action Sheet */}
      <MobilePlayerActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        song={currentSong}
      />
    </>
  );
};
