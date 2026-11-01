import React, { useState, useRef, useEffect } from 'react';
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
  Check,
  Sparkles,
  Waves,
  Headphones,
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
    theme,
  } = useMusic();

  // 3 Slides: 'lyrics' (left) <-> 'disc' (center default) <-> 'info' (right, matching Screenshot 4)
  const [activeTab, setActiveTab] = useState<'lyrics' | 'disc' | 'info'>('disc');
  const [showQueueSheet, setShowQueueSheet] = useState(false);
  const [isClosingQueueSheet, setIsClosingQueueSheet] = useState(false);

  const [showQualitySheet, setShowQualitySheet] = useState(false);
  const [isClosingQualitySheet, setIsClosingQualitySheet] = useState(false);

  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [isClosingPlayer, setIsClosingPlayer] = useState(false);

  // Scrubber dragging state
  const scrubTrackRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);

  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  // Swipe gesture handling between 3 slides
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

    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY) * 0.8) {
      if (deltaX < 0) {
        // Swiping left (move forward to next slide)
        if (activeTab === 'lyrics') setActiveTab('disc');
        else if (activeTab === 'disc') setActiveTab('info');
      } else {
        // Swiping right (move back to previous slide)
        if (activeTab === 'info') setActiveTab('disc');
        else if (activeTab === 'disc') setActiveTab('lyrics');
      }
    }
  };

  const handleClosePlayer = () => {
    if (isClosingPlayer) return;
    setIsClosingPlayer(true);
    setTimeout(() => {
      setIsMobileFullPlayerOpen(false);
      setIsClosingPlayer(false);
    }, 280);
  };

  const handleCloseQueue = () => {
    if (isClosingQueueSheet) return;
    setIsClosingQueueSheet(true);
    setTimeout(() => {
      setShowQueueSheet(false);
      setIsClosingQueueSheet(false);
    }, 200);
  };

  const handleCloseQuality = () => {
    if (isClosingQualitySheet) return;
    setIsClosingQualitySheet(true);
    setTimeout(() => {
      setShowQualitySheet(false);
      setIsClosingQualitySheet(false);
    }, 200);
  };

  const lyrics = currentSong?.lyrics || [];
  const activeLyricIdx = lyrics.findIndex(
    (line, index) =>
      currentTime >= line.time &&
      (index === lyrics.length - 1 || currentTime < lyrics[index + 1].time)
  );

  // Auto-scroll active lyric line into center (Called unconditionally before any early return)
  useEffect(() => {
    if (isMobileFullPlayerOpen && activeTab === 'lyrics' && activeLyricIdx >= 0 && lyricsContainerRef.current) {
      const activeEl = lyricsContainerRef.current.querySelector(`[data-idx="${activeLyricIdx}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIdx, activeTab, isMobileFullPlayerOpen]);

  if (!isMobileFullPlayerOpen || !currentSong) return null;

  const isLiked = likedSongIds.includes(currentSong.id);
  const currentFormat = songFormatMap[currentSong.id] || preferredAudioFormat;

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
      <div
        data-theme={theme}
        style={{
          background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-primary) 55%, var(--bg-sidebar) 100%)',
          color: 'var(--text-primary)',
        }}
        className={`fixed inset-0 z-50 flex flex-col select-none duration-300 overflow-hidden font-['Roboto_Condensed'] ${
          isClosingPlayer ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'
        }`}
      >
        {/* Ambient background glow matching theme accent */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <div
            style={{ backgroundColor: 'var(--color-accent)' }}
            className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-[100px]"
          />
          <div
            style={{ backgroundColor: 'var(--color-accent)' }}
            className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-[100px]"
          />
        </div>

        {/* Top Header with 3 Page Indicators */}
        <header className="relative z-20 px-4 pt-3 pb-2 flex items-center justify-between shrink-0 border-b border-[var(--border-color)]">
          <button
            onClick={handleClosePlayer}
            className="p-2 -ml-1 rounded-full text-[var(--text-primary)] hover:opacity-80 active:scale-95 transition-transform cursor-pointer"
            aria-label="Đóng trình phát nhạc"
          >
            <ChevronDown className="w-6 h-6" />
          </button>

          <div className="text-center truncate px-2">
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-semibold">
              PHÁT TỪ
            </p>
            <p className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[200px] mx-auto">
              {activeTab === 'disc'
                ? (playbackSource || 'Bài hát gợi ý')
                : activeTab === 'lyrics'
                ? 'Lời bài hát'
                : 'Thông tin bài hát'}
            </p>
            {/* 3 Page indicator pills: click or swipe between Lyrics, Disc, and Song Info */}
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <button
                onClick={() => setActiveTab('lyrics')}
                style={activeTab === 'lyrics' ? { backgroundColor: 'var(--color-accent)' } : undefined}
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                  activeTab === 'lyrics' ? 'w-5 shadow-sm' : 'w-1.5 bg-[var(--text-secondary)]/40'
                }`}
                title="Lời bài hát"
                aria-label="Lời bài hát"
              />
              <button
                onClick={() => setActiveTab('disc')}
                style={activeTab === 'disc' ? { backgroundColor: 'var(--color-accent)' } : undefined}
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                  activeTab === 'disc' ? 'w-5 shadow-sm' : 'w-1.5 bg-[var(--text-secondary)]/40'
                }`}
                title="Đĩa xoay"
                aria-label="Đĩa xoay"
              />
              <button
                onClick={() => setActiveTab('info')}
                style={activeTab === 'info' ? { backgroundColor: 'var(--color-accent)' } : undefined}
                className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                  activeTab === 'info' ? 'w-5 shadow-sm' : 'w-1.5 bg-[var(--text-secondary)]/40'
                }`}
                title="Thông tin bài hát"
                aria-label="Thông tin bài hát"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 -mr-1">
            {/* 3-dots Menu Button */}
            <button
              onClick={() => setIsActionSheetOpen(true)}
              className="p-2 text-[var(--text-primary)] hover:opacity-80 active:scale-95 transition-transform relative cursor-pointer"
              title="Tùy chọn mở rộng"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Center View: 3-Slide Carousel [Lyrics <-> Disc <-> Song Info] */}
        <main
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative z-10 flex-1 w-full overflow-hidden min-h-0 select-none touch-pan-y"
        >
          <div
            className="flex w-[300%] h-full transition-transform duration-300 ease-out will-change-transform"
            style={{
              transform:
                activeTab === 'lyrics'
                  ? 'translateX(0%)'
                  : activeTab === 'disc'
                  ? 'translateX(-33.333333%)'
                  : 'translateX(-66.666666%)',
            }}
          >
            {/* Slide 1: LỜI BÀI HÁT (Left-aligned, Word-by-word karaoke runner like Zing MP3, no horizontal scroll) */}
            <div className="w-1/3 h-full flex flex-col px-6 py-2 overflow-hidden">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)] shrink-0">
                <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">
                  Lời bài hát (LRC)
                </span>
                <button
                  onClick={() => setActiveTab('disc')}
                  style={{ color: 'var(--color-accent)' }}
                  className="text-xs hover:opacity-80 font-semibold cursor-pointer"
                >
                  Quay lại đĩa nhạc
                </button>
              </div>

              {/* Requirement 4: Left-aligned, breaks words normally, zero horizontal scrollbar */}
              <div
                ref={lyricsContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-2 py-4 space-y-4 text-left select-none"
              >
                {lyrics.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[var(--text-secondary)] text-xs text-center">
                    Chưa có lời bài hát đồng bộ cho ca khúc này
                  </div>
                ) : (
                  lyrics.map((line, idx) => {
                    const isCurrentLine = idx === activeLyricIdx;
                    const isPastLine = idx < activeLyricIdx;

                    // Calculate line duration for word-by-word distribution
                    const nextTime = idx < lyrics.length - 1 ? lyrics[idx + 1].time : safeDuration;
                    const lineDuration = Math.max(1.2, Math.min(8, nextTime - line.time));
                    const vocalDuration = lineDuration * 0.88;

                    const words = line.text.trim().split(/\s+/).filter(Boolean);
                    const totalChars = words.reduce((acc, w) => acc + Math.max(1, w.length), 0);

                    let charAcc = 0;

                    return (
                      <div
                        key={idx}
                        data-idx={idx}
                        onClick={() => seekTo(line.time)}
                        className={`cursor-pointer transition-all duration-200 text-left w-full break-words whitespace-normal leading-relaxed overflow-x-hidden ${
                          isCurrentLine ? 'py-1.5' : 'py-1 opacity-65 hover:opacity-100'
                        }`}
                      >
                        {isCurrentLine ? (
                          /* Requirement 5: Chữ chạy từng chữ như Zing MP3 từ file LRC */
                          <div className="text-left w-full break-words whitespace-normal text-lg sm:text-xl font-bold leading-relaxed">
                            {words.map((word, wIdx) => {
                              const wordWeight = Math.max(1, word.length);
                              const wStart = line.time + (charAcc / totalChars) * vocalDuration;
                              const wEnd = wStart + (wordWeight / totalChars) * vocalDuration;
                              charAcc += wordWeight;

                              let fillPct = 0;
                              if (currentTime >= wEnd) {
                                fillPct = 100;
                              } else if (currentTime <= wStart) {
                                fillPct = 0;
                              } else {
                                fillPct = Math.min(100, Math.max(0, ((currentTime - wStart) / (wEnd - wStart)) * 100));
                              }

                              const isWordSinging = fillPct > 0 && fillPct < 100;

                              return (
                                <span
                                  key={wIdx}
                                  className={`inline-block mr-1.5 transition-all select-none ${
                                    isWordSinging ? 'scale-105' : ''
                                  }`}
                                  style={{
                                    backgroundImage: `linear-gradient(to right, #fbbf24 0%, #f59e0b ${fillPct}%, rgba(255, 255, 255, 0.45) ${fillPct}%, rgba(255, 255, 255, 0.45) 100%)`,
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    textShadow: fillPct > 0 ? '0 0 10px rgba(251, 191, 36, 0.5)' : 'none',
                                  }}
                                >
                                  {word}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p
                            className={`text-sm sm:text-base font-semibold text-left break-words whitespace-normal leading-relaxed ${
                              isPastLine ? 'text-white/60' : 'text-white/40'
                            }`}
                          >
                            {line.text}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Slide 2: ĐĨA NHẠC (Rotating Disc - Center Default) */}
            <div className="w-1/3 h-full flex flex-col items-center justify-center px-4 py-2 overflow-hidden">
              <div className="relative w-[min(80vw,305px)] h-[min(80vw,305px)] aspect-square rounded-full shadow-2xl relative border-2 border-white/10 flex items-center justify-center overflow-hidden">
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
                    <Disc3 className="w-24 h-24 text-white/70" />
                  )}
                </div>
              </div>
            </div>

            {/* Slide 3: THÔNG TIN BÀI HÁT (Matching Screenshot 4) */}
            <div className="w-1/3 h-full flex flex-col justify-center px-4 py-2 overflow-y-auto no-scrollbar">
              <div className="w-full max-w-sm mx-auto p-5 rounded-3xl bg-white/[0.04] border border-white/10 shadow-2xl backdrop-blur-md space-y-4">
                {/* Top Row: Cover + Title, Artist, Likes, Listens */}
                <div className="flex items-center gap-3.5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/15 bg-zinc-900 shrink-0 shadow-lg">
                    {currentSong.coverImage ? (
                      <img
                        src={currentSong.coverImage}
                        alt={currentSong.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-indigo-800 flex items-center justify-center font-bold text-xs text-white/60">
                        XK
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black text-white truncate leading-snug">
                      {currentSong.title}
                    </h3>
                    <p className="text-xs text-white/60 truncate mt-0.5 font-medium">
                      {currentSong.artists}
                    </p>
                    {/* Likes and Listens Stats matching Screenshot 4 */}
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-white/70">
                      <span className="flex items-center gap-1 font-semibold">
                        <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" />
                        <span>75,4K</span>
                      </span>
                      <span className="flex items-center gap-1 font-semibold">
                        <Headphones className="w-3.5 h-3.5 text-cyan-400" />
                        <span>
                          {currentSong.playCount ? `${(currentSong.playCount / 1000).toFixed(1)}K` : '3,6M'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Divider line */}
                <div className="border-t border-white/10" />

                {/* 2-column Metadata list matching Screenshot 4 */}
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/50 font-medium">Album</span>
                    <span className="text-white font-bold text-right truncate">
                      {currentSong.album ? `${currentSong.album} (Single)` : 'Em Vá Đời Anh (Single)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/50 font-medium">Nhạc sĩ</span>
                    <span className="text-white font-bold text-right truncate">
                      {currentSong.composer || currentSong.artists || 'Thiên Chí'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/50 font-medium">Thể loại</span>
                    <span className="text-white font-bold text-right truncate">
                      {currentSong.genre || 'Việt Nam, V-Pop'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/50 font-medium">Phát hành</span>
                    <span className="text-white font-bold text-right font-mono">
                      {currentSong.releaseDate || '06/06/2026'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/50 font-medium">Cung cấp</span>
                    <span className="text-white font-bold text-right truncate">
                      {currentSong.provider || 'VIEENT Music'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Song Info Row: Share (left) + Title & Artist (center) + Heart (right) */}
        <div className="relative z-10 px-6 mb-2 flex items-center justify-between gap-3 shrink-0">
          {/* Left: Share Icon */}
          <button
            onClick={() => openShareModal(currentSong)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-all shrink-0 cursor-pointer"
            title="Chia sẻ bài hát"
          >
            <Share2 className="w-5 h-5" />
          </button>

          {/* Center: Title & Artist */}
          <div className="flex-1 min-w-0 text-center px-2">
            <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)] truncate leading-snug">
              {currentSong.title}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{currentSong.artists}</p>
          </div>

          {/* Right: Heart / Like Icon */}
          <button
            onClick={() => toggleLike(currentSong.id)}
            className="p-2 text-[var(--text-secondary)] hover:text-red-400 active:scale-95 transition-all shrink-0 cursor-pointer"
            title="Yêu thích bài hát"
          >
            <Heart
              className={`w-5 h-5 ${isLiked ? 'text-red-500 fill-red-500' : ''}`}
            />
          </button>
        </div>

        {/* Scrubber Progress Bar - Requirement 2: Smaller Thumb Knob (w-2.5 h-2.5) */}
        <div className="relative z-10 px-6 mb-2 shrink-0">
          <div
            ref={scrubTrackRef}
            onPointerDown={handleScrubPointerDown}
            className="relative py-2 flex items-center cursor-pointer group"
          >
            <div className="w-full h-1.5 bg-[var(--text-secondary)]/25 rounded-full relative overflow-visible">
              <div
                className="h-full rounded-full relative"
                style={{ width: `${scrubPercent}%`, backgroundColor: 'var(--color-accent)' }}
              >
                {/* Requirement 2: Smaller Thumb Knob */}
                <div
                  style={{ backgroundColor: 'var(--color-accent)' }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full shadow-[0_0_6px_var(--color-accent)] ring-1.5 ring-white -mr-1.5"
                />
              </div>
            </div>
          </div>

          {/* Accurate Timestamps directly below */}
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums font-mono">
            <span>{formatTime(displayScrubTime)}</span>
            <span>{formatTime(safeDuration)}</span>
          </div>
        </div>

        {/* Big Playback Controls Row matching theme colors */}
        <div className="relative z-10 px-6 py-2 flex items-center justify-between max-w-sm mx-auto w-full shrink-0">
          <button
            onClick={toggleShuffle}
            style={isShuffle ? { color: 'var(--color-accent)', filter: 'drop-shadow(0 0 8px var(--color-accent))' } : undefined}
            className={`p-2 transition-all cursor-pointer ${
              !isShuffle ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]' : ''
            }`}
            title="Phát ngẫu nhiên"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button onClick={prevSong} className="p-2 text-[var(--text-primary)] active:scale-95 transition-transform cursor-pointer">
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          {/* Theme Accent Circle Play/Pause button */}
          <button
            onClick={togglePlay}
            style={{ backgroundColor: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-white active:scale-95 transition-transform shadow-xl cursor-pointer hover:opacity-90"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-white" />
            ) : (
              <Play className="w-7 h-7 fill-white ml-1" />
            )}
          </button>

          <button onClick={nextSong} className="p-2 text-[var(--text-primary)] active:scale-95 transition-transform cursor-pointer">
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            style={repeatMode !== 'off' ? { color: 'var(--color-accent)', filter: 'drop-shadow(0 0 8px var(--color-accent))' } : undefined}
            className={`p-2 transition-all cursor-pointer ${
              repeatMode === 'off' ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]' : ''
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

        {/* Bottom 5 Utility Buttons */}
        <footer className="relative z-10 px-6 pb-6 pt-2 flex items-center justify-between text-[var(--text-secondary)] shrink-0">
          {/* 1: Theme palette changer */}
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-transform cursor-pointer"
            title="Đổi chủ đề / Theme giao diện"
          >
            <Palette className="w-5 h-5" />
          </button>

          {/* 2: Add to Playlist */}
          <button
            onClick={() => openAddToPlaylistModal(currentSong)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-transform cursor-pointer"
            title="Thêm vào danh sách phát"
          >
            <FolderPlus className="w-5 h-5" />
          </button>

          {/* 3: Quality Badge in Center: 320 Kbps or WAV */}
          <button
            onClick={() => setShowQualitySheet(true)}
            className="px-3.5 py-1 rounded-full bg-[var(--bg-surface-hover)] hover:opacity-90 border border-[var(--border-color)] text-[11px] font-bold text-[var(--text-primary)] tracking-wider active:scale-95 transition-all shadow-sm cursor-pointer"
            title="Chọn chất lượng âm thanh: 320 Kbps hoặc WAV Lossless"
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
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-transform cursor-pointer"
            title={isSongPurchased(currentSong.id) ? 'Tải ngay' : 'Mua & Tải'}
          >
            <Download className="w-5 h-5" />
          </button>

          {/* 5: Queue / Playlist icon */}
          <button
            onClick={() => setShowQueueSheet(true)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition-transform cursor-pointer"
            title="Danh sách phát"
          >
            <ListMusic className="w-5 h-5" />
          </button>
        </footer>

        {/* Quality Selector Sheet for Mobile */}
        {showQualitySheet && (
          <div
            className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end duration-200 ${
              isClosingQualitySheet ? 'animate-out fade-out' : 'animate-in fade-in'
            }`}
            onClick={handleCloseQuality}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`w-full bg-[var(--bg-surface)] border-t border-[var(--border-color)] rounded-t-3xl p-5 shadow-2xl text-[var(--text-primary)] space-y-4 duration-200 ${
                isClosingQualitySheet ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'
              }`}
            >
              <div className="w-10 h-1 bg-[var(--text-secondary)]/30 rounded-full mx-auto" />
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-[var(--color-accent)]" />
                  <h3 className="text-sm font-bold">Chất lượng âm thanh</h3>
                </div>
                <button onClick={handleCloseQuality} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
                  Đóng
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSongAudioFormat(currentSong.id, 'MP3');
                    playSong(currentSong, 'MP3');
                    handleCloseQuality();
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    currentFormat === 'MP3'
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/20 text-[var(--text-primary)]'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] hover:opacity-90 text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-bold flex items-center gap-2">
                      <span className="text-[var(--text-primary)]">320 Kbps (Chuẩn HQ)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">MP3</span>
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Âm thanh chất lượng cao, mượt mà và tiết kiệm dữ liệu</p>
                  </div>
                  {currentFormat === 'MP3' && (
                    <Check
                      style={{ color: 'var(--color-accent)' }}
                      className="w-5 h-5 stroke-[3]"
                    />
                  )}
                </button>

                <button
                  onClick={() => {
                    setSongAudioFormat(currentSong.id, 'WAV');
                    playSong(currentSong, 'WAV');
                    handleCloseQuality();
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    currentFormat === 'WAV'
                      ? 'border-amber-400 bg-amber-500/20 text-[var(--text-primary)]'
                      : 'border-[var(--border-color)] bg-[var(--bg-surface-hover)] hover:opacity-90 text-[var(--text-secondary)]'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-bold flex items-center gap-2">
                      <span className="text-[var(--text-primary)]">WAV (Lossless 24-bit)</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-black flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" /> MASTER
                      </span>
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Âm thanh nguyên bản phòng thu, chi tiết từng nhạc cụ</p>
                  </div>
                  {currentFormat === 'WAV' && <Check className="w-5 h-5 text-amber-400 stroke-[3]" />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Queue Sheet for Mobile (Requirement 7: Open/close animation) */}
        {showQueueSheet && (
          <div
            className={`absolute inset-x-0 bottom-0 top-36 z-50 bg-[var(--bg-surface)] rounded-t-3xl border-t border-[var(--border-color)] p-4 flex flex-col shadow-2xl duration-200 ${
              isClosingQueueSheet ? 'animate-out slide-out-to-bottom' : 'animate-in slide-in-from-bottom'
            }`}
          >
            <div className="w-10 h-1 bg-[var(--text-secondary)]/30 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] shrink-0">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Danh sách phát ({queue.length})</h3>
              <button
                onClick={handleCloseQueue}
                style={{ color: 'var(--color-accent)' }}
                className="text-xs font-semibold cursor-pointer hover:opacity-80"
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
                    handleCloseQueue();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-surface-hover)] hover:opacity-90 cursor-pointer border border-[var(--border-color)]"
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{song.title}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] truncate">{song.artists}</p>
                  </div>
                  <Play
                    style={{ color: 'var(--color-accent)' }}
                    className="w-3.5 h-3.5 fill-current shrink-0"
                  />
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
