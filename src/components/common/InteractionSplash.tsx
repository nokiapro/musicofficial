import React, { useState, useEffect } from 'react';
import { Play, Heart, Disc } from 'lucide-react';

export const InteractionSplash: React.FC = () => {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      return sessionStorage.getItem('xuanken_splash_dismissed') !== 'true';
    } catch (e) {
      return true;
    }
  });
  const [isHiding, setIsHiding] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleStart = () => {
    if (isHiding) return;
    setIsHiding(true);
    try {
      sessionStorage.setItem('xuanken_splash_dismissed', 'true');
    } catch (e) {}

    // Dismiss splash without autoplaying any song (Item 5)
    setTimeout(() => {
      setIsVisible(false);
    }, 450);
  };

  useEffect(() => {
    const handleKeyDown = () => {
      if (isVisible && !isHiding) {
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, isHiding]);

  if (!isVisible) return null;

  return (
    <div
      id="interaction-hint"
      onClick={handleStart}
      className={`fixed inset-0 z-[10000] flex flex-col justify-center items-center cursor-pointer select-none transition-all duration-500 font-['Roboto_Condensed'] ${
        isHiding ? 'opacity-0 invisible pointer-events-none' : 'opacity-100 visible'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(18, 8, 34, 0.98), rgba(28, 14, 52, 0.98), rgba(18, 8, 34, 0.98))',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Exact .hint-logo matching music6.xuanken.name.vn */}
      <div className="hint-logo">
        {!imgError ? (
          <img
            src="https://raw.githubusercontent.com/nokiapro/xuankenofficial/main/logoofficial.png"
            alt="Logo Xuanken Music"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full rounded-full border-4 border-white/80 shadow-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center">
            <Disc className="w-14 h-14 sm:w-16 sm:h-16 text-white animate-spin-slow" />
          </div>
        )}
      </div>

      {/* Animated Gradient Title */}
      <h1
        className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-[4px] sm:tracking-[6px] mb-1 text-center px-4"
        style={{
          background: 'linear-gradient(135deg, #c20175, #b33cea, #17adca, #dd4809)',
          backgroundSize: '250% 250%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'titleGradient 3.5s ease infinite',
        }}
      >
        XUANKEN MUSIC
      </h1>

      {/* Subtitle */}
      <p className="text-xs sm:text-sm text-[#aaa] tracking-[5px] sm:tracking-[7px] font-bold uppercase mb-8 sm:mb-11 opacity-80">
        OFFICIAL
      </p>

      {/* Touch To Start Button with breathing glow */}
      <div
        className="hint-button flex items-center gap-3.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/25 backdrop-blur-xl px-7 sm:px-9 py-3 sm:py-4 rounded-full shadow-[0_8px_25px_rgba(0,0,0,0.3)] transition-all duration-300"
        style={{ animation: 'buttonGlow 2.5s ease-in-out infinite' }}
      >
        <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shadow-md shrink-0">
          <Play className="w-3.5 h-3.5 fill-black ml-0.5 text-black" />
        </div>
        <span className="text-sm sm:text-base font-bold uppercase tracking-[2px] text-white">
          CHẠM ĐỂ BẮT ĐẦU
        </span>
      </div>

      {/* Bottom Decoration */}
      <div className="absolute bottom-6 sm:bottom-9 left-0 right-0 text-center text-xs text-white/40 tracking-[1.5px] font-semibold flex items-center justify-center gap-1.5">
        <Heart
          className="w-3.5 h-3.5 text-red-500 fill-red-500"
          style={{ animation: 'heartBeat 1.4s ease infinite' }}
        />
        <span>DESIGNER BY XUANKEN OFFICIAL</span>
        <Heart
          className="w-3.5 h-3.5 text-red-500 fill-red-500"
          style={{ animation: 'heartBeat 1.4s ease infinite 0.2s' }}
        />
      </div>
    </div>
  );
};
