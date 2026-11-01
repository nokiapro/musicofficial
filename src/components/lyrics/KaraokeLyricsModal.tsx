import React, { useRef, useCallback } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Mic2, Music, BarChart2 } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ProgressBar } from '../common/ProgressBar';
import { cleanLyricText } from '../../utils/lyricUtils';

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
    volume,
    setVolume,
    isMuted,
    toggleMute,
    isLyricsOpen,
    setIsLyricsOpen,
    theme,
  } = useMusic();

  const volumeTrackRef = useRef<HTMLDivElement | null>(null);

  const calculateVolumeFromEvent = useCallback((clientX: number): number => {
    if (!volumeTrackRef.current) return 1;
    const rect = volumeTrackRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const pct = Math.min(1, Math.max(0, clickX / rect.width));
    return pct;
  }, []);

  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isMuted) toggleMute();
    const newVol = calculateVolumeFromEvent(e.clientX);
    setVolume(newVol);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const movedVol = calculateVolumeFromEvent(moveEvent.clientX);
      setVolume(movedVol);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  if (!isLyricsOpen || !currentSong) return null;

  const lyrics = currentSong.lyrics || [];
  const activeIndex = lyrics.findIndex(
    (line, index) =>
      currentTime >= line.time &&
      (index === lyrics.length - 1 || currentTime < lyrics[index + 1].time)
  );

  // 5 lines of lyrics like Zing MP3 (2 before, current active in middle, 2 after)
  const centerIdx = activeIndex >= 0 ? activeIndex : 0;
  const fiveLineIndices = [centerIdx - 2, centerIdx - 1, centerIdx, centerIdx + 1, centerIdx + 2];

  return (
    <div
      data-theme={theme}
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-in fade-in duration-300 font-['Roboto_Condensed'] select-none transition-colors"
    >
      {/* Dynamic blurred ambient glow behind lyrics */}
      <div className="absolute inset-0 pointer-events-none opacity-30 overflow-hidden">
        <div
          style={{ backgroundColor: 'var(--color-accent)' }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px]"
        />
        <div
          style={{ backgroundColor: 'var(--color-accent)' }}
          className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] rounded-full blur-[160px]"
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] backdrop-blur-md bg-black/25">
        <div className="flex items-center gap-3">
          <div
            style={{ backgroundColor: 'var(--color-accent)' }}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg text-white"
          >
            <Mic2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold truncate max-w-xs md:max-w-md text-[var(--text-primary)]">{currentSong.title}</h1>
            <p className="text-xs text-[var(--text-secondary)] truncate">{currentSong.artists}</p>
          </div>
        </div>

        {/* Clean Lời bài hát header tag */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/10 rounded-full border border-white/15 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Lời bài hát</span>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsLyricsOpen(false)}
          className="p-2 rounded-full hover:bg-white/15 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          title="Đóng lời bài hát"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content Area matching Screenshot 1 (Zing MP3 layout) */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center p-6 gap-8 md:gap-14 overflow-hidden">
        {/* Left Side (Desktop): Big Square Rounded Album Cover (Requirement 1: ảnh bìa to) */}
        <div className="hidden lg:flex flex-col items-center justify-center shrink-0">
          <div className="relative w-72 h-72 md:w-80 md:h-80 lg:w-[320px] lg:h-[320px] rounded-2xl shadow-2xl overflow-hidden border border-white/10 bg-zinc-900 group">
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
            >
              <Music className="w-20 h-20 text-white/50" />
            </div>

            {/* Small subtle equalizer icon in bottom-left corner like Screenshot 1 */}
            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1.5 text-white/80">
              <BarChart2 className="w-4 h-4 text-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* Right Side: 5 Lines of Zing MP3 Lyrics (Requirement 1: to, lời dài không bị xuống dòng trên PC, xuống dòng chỉ ở mobile) */}
        <div className="flex-1 w-full max-w-3xl flex flex-col justify-center items-start text-left px-4 sm:px-8 py-6 select-none overflow-hidden">
          {lyrics.length === 0 ? (
            <div className="w-full py-12 text-center text-[var(--text-secondary)] text-base">
              Chưa có lời bài hát đồng bộ cho ca khúc này
            </div>
          ) : (
            <div className="w-full flex flex-col gap-3 sm:gap-4 text-left transition-all duration-300">
              {fiveLineIndices.map((targetIdx, slotIdx) => {
                if (targetIdx < 0 || targetIdx >= lyrics.length) {
                  return (
                    <div
                      key={`empty-slot-${slotIdx}-${targetIdx}`}
                      className="h-10 sm:h-14 invisible select-none"
                    />
                  );
                }

                const line = lyrics[targetIdx];
                const displayText = cleanLyricText(line.text);
                if (!displayText) {
                  return (
                    <div
                      key={`empty-text-${slotIdx}-${targetIdx}`}
                      className="h-10 sm:h-14 invisible select-none"
                    />
                  );
                }

                const isCurrent = targetIdx === activeIndex;
                const isPast = targetIdx < activeIndex;

                return (
                  <div
                    key={`line-${targetIdx}-${line.time}`}
                    onClick={() => seekTo(line.time)}
                    className={`cursor-pointer text-left transition-all duration-300 py-1.5 rounded-lg w-full ${
                      /* Requirement 1: whitespace-nowrap on desktop (md:) so long lyrics never wrap, whitespace-normal on mobile */
                      'whitespace-normal md:whitespace-nowrap overflow-hidden text-ellipsis'
                    } ${
                      isCurrent
                        ? 'text-yellow-400 font-bold text-2xl sm:text-3xl md:text-4xl leading-tight drop-shadow-[0_0_14px_rgba(250,204,21,0.45)]'
                        : isPast
                        ? 'text-white/45 hover:text-white/80 font-medium text-lg sm:text-xl md:text-2xl leading-snug'
                        : 'text-white/60 hover:text-white/95 font-medium text-lg sm:text-xl md:text-2xl leading-snug'
                    }`}
                    title="Bấm để phát từ câu hát này"
                  >
                    {displayText}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Floating Scrubber & Controls (Requirement 2: Progress bar & Volume color according to active theme) */}
      <footer className="relative z-10 px-6 py-4 border-t border-[var(--border-color)] bg-black/40 backdrop-blur-md flex flex-col gap-2">
        {/* Scrubber Bar: start time, progress bar, end time on same row with active theme color */}
        <div className="max-w-3xl mx-auto w-full">
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={seekTo}
            showDemoMarker={false}
            inline={true}
            useThemeFill={true}
          />
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between max-w-3xl mx-auto w-full">
          {/* Requirement 2: Volume control matching outside player bar & following active theme */}
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer"
              title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-red-400" />
              ) : (
                <Volume2 className="w-5 h-5 text-white/80" />
              )}
            </button>
            <div
              ref={volumeTrackRef}
              onPointerDown={handleVolumePointerDown}
              className="w-20 sm:w-28 py-2 cursor-pointer group flex items-center"
              title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
            >
              <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden relative shadow-inner">
                <div
                  className="h-full rounded-full transition-[width] duration-75"
                  style={{
                    width: `${(isMuted ? 0 : volume) * 100}%`,
                    backgroundColor: 'var(--color-accent)',
                  }}
                />
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold text-white/60 w-8 text-right select-none hidden sm:inline-block">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={prevSong}
              className="p-2 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer active:scale-95"
              title="Bài trước"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              style={{ backgroundColor: 'var(--color-accent)' }}
              className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer hover:opacity-90"
              title={isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
            <button
              onClick={nextSong}
              className="p-2 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors cursor-pointer active:scale-95"
              title="Bài tiếp theo"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
          </div>

          <div className="text-xs text-[var(--text-secondary)] hidden sm:block">
            Nhấn ESC hoặc [x] để thoát
          </div>
        </div>
      </footer>
    </div>
  );
};
