import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useMusic } from '../../context/MusicContext';

export const FloatingVinylDisc: React.FC = () => {
  const { currentSong, isPlaying, setIsMobileFullPlayerOpen } = useMusic();

  // Position state (defaults to near top-right corner of viewport)
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? window.innerWidth - 72 : 280,
    y: 130,
  });

  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialElementPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Keep within bounds on resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(Math.max(12, prev.x), window.innerWidth - 64),
        y: Math.min(Math.max(60, prev.y), window.innerHeight - 120),
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer / Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    initialElementPosRef.current = { ...position };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartPosRef.current.x;
    const dy = touch.clientY - dragStartPosRef.current.y;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      hasMovedRef.current = true;
    }

    const newX = Math.min(Math.max(12, initialElementPosRef.current.x + dx), window.innerWidth - 64);
    const newY = Math.min(Math.max(60, initialElementPosRef.current.y + dy), window.innerHeight - 120);

    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    if (!hasMovedRef.current) {
      // Tap without moving => open full player
      setIsMobileFullPlayerOpen(true);
    }
    isDraggingRef.current = false;
  };

  // Mouse handlers for desktop browser testing mobile layout
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    initialElementPosRef.current = { ...position };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = moveEvent.clientX - dragStartPosRef.current.x;
      const dy = moveEvent.clientY - dragStartPosRef.current.y;

      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasMovedRef.current = true;
      }

      const newX = Math.min(Math.max(12, initialElementPosRef.current.x + dx), window.innerWidth - 64);
      const newY = Math.min(Math.max(60, initialElementPosRef.current.y + dy), window.innerHeight - 120);

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      if (!hasMovedRef.current) {
        setIsMobileFullPlayerOpen(true);
      }
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!currentSong) return null;

  return (
    <div
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      className="fixed top-0 left-0 z-50 cursor-grab active:cursor-grabbing select-none transition-transform duration-75 ease-out animate-in zoom-in-90 duration-300"
      title="Đĩa than di chuyển được - Nhấn để mở trình phát nhạc"
    >
      {/* Floating Vinyl Disc: ONLY THE DISC, NO SONG TITLE */}
      <div className="relative w-14 h-14 rounded-full bg-zinc-950 border-2 border-white/40 ring-1 ring-purple-500/50 shadow-2xl overflow-hidden flex items-center justify-center group active:scale-95 transition-transform">
        <div
          style={{
            animation: 'spinSlow 10s linear infinite',
            animationPlayState: isPlaying ? 'running' : 'paused',
          }}
          className="w-full h-full rounded-full flex items-center justify-center relative"
        >
          {/* Conic specular reflection of vinyl grooves */}
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.4)_90deg,transparent_180deg,rgba(255,255,255,0.4)_270deg,transparent_360deg)] pointer-events-none opacity-80" />

          {/* Grooves rings */}
          <div className="absolute inset-1 rounded-full border border-white/20 pointer-events-none" />
          <div className="absolute inset-2.5 rounded-full border border-zinc-700 pointer-events-none" />

          {/* Center Cover / Label */}
          <div className="w-5 h-5 rounded-full overflow-hidden border border-white/80 bg-zinc-900 flex items-center justify-center relative z-10 shadow-sm">
            {currentSong.coverImage ? (
              <img
                src={currentSong.coverImage}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-purple-500 to-pink-500" />
            )}
            {/* Center Spindle Hole */}
            <div className="absolute w-1.5 h-1.5 rounded-full bg-zinc-950 border border-white/60 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};
