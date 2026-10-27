import React, { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Mic2, Disc3 } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { Visualizer } from '../common/Visualizer';

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
  } = useMusic();

  const [activeTab, setActiveTab] = useState<'lyrics' | 'karaoke'>('karaoke');
  const lyricsContainerRef = useRef<HTMLDivElement | null>(null);

  if (!isLyricsOpen || !currentSong) return null;

  const lyrics = currentSong.lyrics || [];
  const activeIndex = lyrics.findIndex(
    (line, index) =>
      currentTime >= line.time &&
      (index === lyrics.length - 1 || currentTime < lyrics[index + 1].time)
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#120822] text-white overflow-hidden animate-in fade-in duration-300">
      {/* Dynamic blurred ambient glow behind lyrics */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        <div
          className={`absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] bg-gradient-to-tr ${currentSong.coverGradient}`}
        />
        <div
          className={`absolute -bottom-32 -right-32 w-[30rem] h-[30rem] rounded-full blur-[160px] bg-gradient-to-br ${currentSong.coverGradient}`}
        />
      </div>

      {/* Top Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-700 flex items-center justify-center shadow-lg">
            <Mic2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold truncate max-w-xs md:max-w-md">{currentSong.title}</h1>
            <p className="text-xs text-white/60 truncate">{currentSong.artists}</p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex items-center p-1 bg-white/10 rounded-full border border-white/10">
          <button
            onClick={() => setActiveTab('karaoke')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'karaoke'
                ? 'bg-[#9b4de0] text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Karaoke
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
              activeTab === 'lyrics'
                ? 'bg-[#9b4de0] text-white shadow-md'
                : 'text-white/70 hover:text-white'
            }`}
          >
            Lời bài hát
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={() => setIsLyricsOpen(false)}
          className="p-2 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors"
          title="Đóng lời bài hát"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center p-6 gap-8 overflow-hidden">
        {/* Left Side (Desktop): Rotating Vinyl Disc */}
        <div className="hidden lg:flex flex-col items-center justify-center w-80 shrink-0">
          <div className="relative w-64 h-64 rounded-full p-2 bg-gradient-to-tr from-zinc-900 via-zinc-800 to-zinc-950 shadow-2xl border-4 border-zinc-700/50 flex items-center justify-center">
            <div
              className={`w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br ${currentSong.coverGradient} shadow-inner animate-spin-slow ${
                !isPlaying ? 'paused' : ''
              }`}
            >
              <div className="w-20 h-20 rounded-full bg-[#120822] border-4 border-zinc-900 flex items-center justify-center">
                <Disc3 className="w-8 h-8 text-white/60" />
              </div>
            </div>
            {/* Center spindle */}
            <div className="absolute w-6 h-6 rounded-full bg-zinc-300 border-2 border-zinc-900 shadow" />
          </div>

          <div className="mt-6 text-center">
            <Visualizer barCount={16} height={20} color="#9b4de0" />
            <p className="text-xs text-white/50 mt-2">Bấm vào bất kỳ câu hát nào để phát từ đoạn đó</p>
          </div>
        </div>

        {/* Right Side: Lyrics Stream */}
        <div
          ref={lyricsContainerRef}
          className="flex-1 w-full max-w-2xl h-full overflow-y-auto px-4 py-16 space-y-6 text-center select-none"
        >
          {lyrics.map((line, index) => {
            const isCurrent = index === activeIndex;
            const isPast = index < activeIndex;

            return (
              <p
                key={index}
                data-index={index}
                onClick={() => seekTo(line.time)}
                className={`cursor-pointer transition-all duration-300 font-semibold px-4 py-2 rounded-xl ${
                  isCurrent
                    ? activeTab === 'karaoke'
                      ? 'text-2xl md:text-3xl lg:text-4xl text-amber-300 font-bold scale-105 drop-shadow-[0_4px_16px_rgba(251,191,36,0.5)]'
                      : 'text-2xl md:text-3xl text-purple-300 font-bold'
                    : isPast
                    ? 'text-base md:text-xl text-white/40 hover:text-white/70'
                    : 'text-base md:text-xl text-white/60 hover:text-white/90'
                }`}
              >
                {line.text}
              </p>
            );
          })}
        </div>
      </main>

      {/* Bottom Floating Scrubber & Controls */}
      <footer className="relative z-10 px-6 py-4 border-t border-white/10 bg-black/40 backdrop-blur-md flex flex-col gap-2">
        {/* Scrubber Bar */}
        <div className="flex items-center gap-3 max-w-3xl mx-auto w-full">
          <span className="text-xs text-white/60 tabular-nums w-10 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={duration}
              value={currentTime}
              onChange={(e) => seekTo(Number(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <span className="text-xs text-white/60 tabular-nums w-10">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer hidden sm:block"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={prevSong}
              className="p-2 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-[#9b4de0] hover:bg-[#8539c9] text-white flex items-center justify-center shadow-lg shadow-[#9b4de0]/40 transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
            <button
              onClick={nextSong}
              className="p-2 rounded-full hover:bg-white/15 text-white/80 hover:text-white transition-colors"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
          </div>

          <div className="text-xs text-white/60 hidden sm:block">
            Nhấn ESC hoặc [x] để thoát
          </div>
        </div>
      </footer>
    </div>
  );
};
