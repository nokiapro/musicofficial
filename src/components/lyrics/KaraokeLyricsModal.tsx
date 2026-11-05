import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Mic2,
  Music,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { cleanLyricText } from '../../utils/lyricUtils';
import { SoundWaveIcon } from '../common/SoundWaveIcon';

export const KaraokeLyricsModal: React.FC = () => {
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
    isLyricsOpen,
    setIsLyricsOpen,
    theme,
  } = useMusic();

  // Scrubber dragging state matching Screenshot 1
  const scrubTrackRef = useRef<HTMLDivElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);

  const safeDuration = Math.max(1, duration || 210);
  const displayTime = isScrubbing && scrubTime !== null ? scrubTime : currentTime;
  const progressPercent = Math.min(100, Math.max(0, (displayTime / safeDuration) * 100));

  // Format mm:ss with leading zeros (e.g. 00:52, 04:33 matching Screenshot 1)
  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Scrubber pointer down & drag handler
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

    const initialT = calcTime(e.clientX);
    setScrubTime(initialT);

    const onPointerMove = (moveEv: PointerEvent) => {
      setScrubTime(calcTime(moveEv.clientX));
    };

    const onPointerUp = (upEv: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      const finalT = calcTime(upEv.clientX);
      seekTo(finalT);
      setIsScrubbing(false);
      setScrubTime(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // Parse lyrics from song.lyrics or fallback parse from song.lrcRaw
  const rawLyrics =
    currentSong?.lyrics && currentSong.lyrics.length > 0
      ? currentSong.lyrics
      : currentSong?.lrcRaw
      ? currentSong.lrcRaw.split('\n').map((line, idx) => {
          const timeMatch = line.match(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/);
          let time = idx * 5;
          if (timeMatch) {
            time = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
          }
          return { time, text: line };
        })
      : [];

  // Filter out empty lines or metadata header lines ([ti:], [ar:], [al:], etc.)
  const lyrics = rawLyrics.filter((line) => {
    const text = cleanLyricText(line.text);
    const isMetadata = /^\s*\[(ti|ar|al|by|offset|length|re|ve):/i.test(line.text);
    return text.length > 0 && !isMetadata;
  });

  let rawActiveIdx = -1;
  for (let i = lyrics.length - 1; i >= 0; i--) {
    if (currentTime >= lyrics[i].time) {
      rawActiveIdx = i;
      break;
    }
  }
  // Exact 5 lines configuration: LINE_HEIGHT is 64px, exactly 5 lines = 320px
  const LINE_HEIGHT = 64;
  const centerIdx = rawActiveIdx >= 0 ? rawActiveIdx : 0;

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isLyricsOpen) {
        setIsLyricsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLyricsOpen, setIsLyricsOpen]);

  if (!isLyricsOpen || !currentSong) return null;

  return (
    <div
      data-theme={theme}
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-in fade-in duration-350 ease-out font-['Roboto_Condensed'] select-none transition-colors"
    >
      {/* Top Header - Badge 'Lời bài hát' removed as requested in earlier item */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] backdrop-blur-md bg-black/25 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div
            style={{ backgroundColor: 'var(--color-accent)' }}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg text-white shrink-0"
          >
            <Mic2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 truncate">
            <h1 className="text-base font-bold truncate max-w-xs md:max-w-md text-[var(--text-primary)]">
              {currentSong.title}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] truncate">{currentSong.artists}</p>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsLyricsOpen(false)}
          className="p-2 rounded-full hover:bg-white/15 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
          title="Đóng lời bài hát (ESC)"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center p-4 md:p-6 gap-6 md:gap-14 overflow-hidden min-h-0">
        {/* Left Side (Desktop): Big Square Rounded Album Cover */}
        <div className="hidden lg:flex flex-col items-center justify-center shrink-0">
          <div className="relative w-72 h-72 md:w-80 md:h-80 lg:w-[320px] lg:h-[320px] rounded-2xl shadow-2xl overflow-hidden border border-white/10 bg-zinc-900 group">
            {currentSong.coverImage ? (
              <img
                src={currentSong.coverImage}
                alt={currentSong.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : null}
            <div
              className={`w-full h-full bg-gradient-to-tr ${
                currentSong.coverGradient || 'from-purple-600 to-indigo-800'
              } flex items-center justify-center ${currentSong.coverImage ? 'absolute inset-0 -z-10' : ''}`}
            >
              <Music className="w-20 h-20 text-white/50" />
            </div>

            {/* White animated jumping audio wave at corner of cover image (no black background) */}
            <SoundWaveIcon
              isPlaying={isPlaying}
              size="lg"
              className="absolute bottom-3 left-3 z-20"
              withBackground={false}
            />
          </div>
        </div>

        {/* Right Side: Exactly 5 Lines of Zing MP3 Lyrics (2 above, middle running line, 2 below - Smooth sliding, no zoom) */}
        <div className="flex-1 min-w-0 w-full max-w-3xl flex flex-col justify-center items-start text-left px-4 sm:px-8 select-none">
          {lyrics.length === 0 ? (
            <div className="w-full py-24 text-center text-white/50 text-base">
              Chưa có lời bài hát đồng bộ cho ca khúc này
            </div>
          ) : (
            <div
              className="w-full h-[320px] overflow-hidden relative mode-kinetic"
              style={{
                maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
              }}
            >
              {/* Vertical sliding track - shifts by exactly 1 line (64px) with smooth 0.65s cubic-bezier(0.16, 1, 0.3, 1) transition */}
              <div
                className="w-full will-change-transform"
                style={{
                  transform: `translateY(-${centerIdx * LINE_HEIGHT}px)`,
                  transition: 'transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                  paddingTop: `${LINE_HEIGHT * 2}px`,
                  paddingBottom: `${LINE_HEIGHT * 2}px`,
                }}
              >
                {lyrics.map((line, idx) => {
                  const displayText = cleanLyricText(line.text);
                  if (!displayText) return null;

                  const isCurrent = idx === centerIdx;
                  const dist = Math.abs(idx - centerIdx);

                  return (
                    <div
                      key={`line-${idx}-${line.time}`}
                      onClick={() => seekTo(line.time)}
                      className={`lyric-line flex items-center text-left w-full cursor-pointer select-none text-xl sm:text-2xl md:text-3xl leading-relaxed transition-all duration-300 py-1.5 ${
                        isCurrent
                          ? 'active font-extrabold text-[#ffdb00] opacity-100 scale-100'
                          : dist === 1
                          ? 'adjacent font-semibold text-white/70 hover:text-white opacity-70'
                          : dist === 2
                          ? 'font-normal text-white/40 hover:text-white/70 opacity-40'
                          : 'opacity-0 pointer-events-none select-none'
                      }`}
                      title="Bấm để phát từ câu hát này"
                    >
                      <span className="w-full whitespace-normal break-words">{displayText}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Player controls and Scrubber matching Screenshot 1 (image_3ee1aba5.png) */}
      <footer className="relative z-10 px-6 py-4 border-t border-[var(--border-color)] bg-black/55 backdrop-blur-md flex flex-col items-center justify-center gap-3 shrink-0">
        <div className="max-w-2xl mx-auto w-full flex flex-col items-center gap-3.5">
          {/* Top Row: Shuffle - Prev - Play/Pause (Vibrant Circle) - Next - Repeat */}
          <div className="flex items-center justify-center gap-6 sm:gap-8">
            {/* 1. Shuffle */}
            <button
              onClick={toggleShuffle}
              style={isShuffle ? { color: 'var(--color-accent, #10b981)' } : undefined}
              className={`p-2 transition-all cursor-pointer ${
                !isShuffle
                  ? 'text-white/70 hover:text-white'
                  : 'drop-shadow-[0_0_8px_var(--color-accent,#10b981)]'
              }`}
              title="Phát ngẫu nhiên"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            {/* 2. Prev */}
            <button
              onClick={prevSong}
              className="p-2 text-white hover:text-white/80 active:scale-95 transition-transform cursor-pointer"
              title="Bài trước"
            >
              <SkipBack className="w-6 h-6 fill-white text-white" />
            </button>

            {/* 3. Play / Pause Button in solid circle matching image 1 */}
            <button
              onClick={togglePlay}
              style={{ backgroundColor: 'var(--color-accent, #10b981)' }}
              className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-xl transition-transform active:scale-95 cursor-pointer hover:opacity-95"
              title={isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-white text-white" />
              ) : (
                <Play className="w-6 h-6 fill-white text-white ml-0.5" />
              )}
            </button>

            {/* 4. Next */}
            <button
              onClick={nextSong}
              className="p-2 text-white hover:text-white/80 active:scale-95 transition-transform cursor-pointer"
              title="Bài tiếp theo"
            >
              <SkipForward className="w-6 h-6 fill-white text-white" />
            </button>

            {/* 5. Repeat */}
            <button
              onClick={toggleRepeat}
              style={repeatMode !== 'off' ? { color: 'var(--color-accent, #10b981)' } : undefined}
              className={`p-2 transition-all cursor-pointer ${
                repeatMode === 'off'
                  ? 'text-white/70 hover:text-white'
                  : 'drop-shadow-[0_0_8px_var(--color-accent,#10b981)]'
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

          {/* Bottom Row: 00:52 [ Scrubber Bar ] 04:33 matching Screenshot 1 */}
          <div className="w-full flex items-center gap-3.5">
            <span className="text-xs font-mono font-bold text-white/80 tabular-nums shrink-0 select-none">
              {formatTime(displayTime)}
            </span>

            {/* Scrubber track with gradient from emerald green to pink matching Screenshot 1 */}
            <div
              ref={scrubTrackRef}
              onPointerDown={handleScrubPointerDown}
              className="flex-1 py-2 flex items-center cursor-pointer group relative"
            >
              <div className="w-full h-1.5 rounded-full bg-white/20 relative overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full relative ${
                    isScrubbing ? '' : 'transition-[width] duration-100 ease-linear'
                  }`}
                  style={{
                    width: `${progressPercent}%`,
                    background: 'linear-gradient(to right, #10b981 0%, #14b8a6 45%, #ec4899 100%)',
                  }}
                />
              </div>

              {/* Slider thumb knob on hover / drag */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_8px_rgba(236,72,153,0.8)] ring-2 ring-emerald-400 pointer-events-none transition-opacity ${
                  isScrubbing ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'
                }`}
                style={{ left: `calc(${progressPercent}% - 7px)` }}
              />
            </div>

            <span className="text-xs font-mono font-bold text-white/80 tabular-nums shrink-0 select-none">
              {formatTime(safeDuration)}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
