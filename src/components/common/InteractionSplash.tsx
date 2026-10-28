import React, { useState } from 'react';
import { useMusic } from '../../context/MusicContext';
import { Play, Heart } from 'lucide-react';

export const InteractionSplash: React.FC = () => {
  const { songs, playSong } = useMusic();
  const [isVisible, setIsVisible] = useState(true);
  const [isHiding, setIsHiding] = useState(false);

  const handleStart = () => {
    if (isHiding) return;
    setIsHiding(true);

    // Pick random song to play from library
    if (songs && songs.length > 0) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      const randomSong = songs[randomIndex];
      playSong(randomSong);
    }

    setTimeout(() => {
      setIsVisible(false);
    }, 600);
  };

  if (!isVisible) return null;

  return (
    <div
      id="interaction-hint"
      onClick={handleStart}
      className={`fixed inset-0 z-[10000] flex flex-col justify-center items-center cursor-pointer select-none transition-all duration-600 ${
        isHiding ? 'opacity-0 invisible pointer-events-none' : 'opacity-100 visible'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.98), rgba(40, 40, 55, 0.98), rgba(50, 50, 65, 0.98))',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Floating Logo with animated pulsing ring */}
      <div className="relative w-28 h-28 sm:w-36 sm:h-36 mb-6 sm:mb-8 animate-[logoFloat_2.5s_ease-in-out_infinite]">
        <div className="absolute -inset-2.5 rounded-full border border-white/40 animate-[pulseRing_2s_linear_infinite]" />
        <img
          src="https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png"
          alt="Logo Xuanken Music"
          className="w-full h-full object-cover rounded-full border-4 border-white/80 shadow-[0_10px_25px_rgba(0,0,0,0.4)] bg-white"
          onError={(e) => {
            e.currentTarget.src = 'https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/icon.png';
          }}
        />
      </div>

      {/* Animated Gradient Title */}
      <h1
        className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-[4px] sm:tracking-[6px] mb-1 text-center px-4 animate-[titleGradient_3s_ease_infinite]"
        style={{
          background: 'linear-gradient(135deg, #c20175, #b33cea, #17adca, #dd4809)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        XUANKEN MUSIC
      </h1>

      {/* Subtitle */}
      <p className="text-xs sm:text-sm text-[#aaa] tracking-[5px] sm:tracking-[7px] font-bold uppercase mb-8 sm:mb-11 opacity-80">
        OFFICIAL
      </p>

      {/* Touch To Start Button */}
      <div className="hint-button flex items-center gap-3.5 bg-white/10 hover:bg-white/15 active:scale-95 border border-white/20 backdrop-blur-xl px-7 sm:px-9 py-3 sm:py-4 rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.3)] transition-all duration-300">
        <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-md shrink-0">
          <Play className="w-3.5 h-3.5 fill-black ml-0.5 text-black" />
        </div>
        <span className="text-sm sm:text-base font-bold uppercase tracking-[2px] text-white">
          CHẠM ĐỂ BẮT ĐẦU
        </span>
      </div>

      {/* Bottom Decoration */}
      <div className="absolute bottom-6 sm:bottom-9 left-0 right-0 text-center text-xs text-white/40 tracking-[1.5px] font-semibold flex items-center justify-center gap-1.5">
        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-[heartBeat_1.5s_ease_infinite]" />
        <span>DESIGNER BY XUANKEN OFFICIAL</span>
        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-[heartBeat_1.5s_ease_infinite]" />
      </div>
    </div>
  );
};
