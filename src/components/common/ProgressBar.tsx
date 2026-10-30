import React, { useState, useRef, useEffect, useCallback } from 'react';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  isPurchased?: boolean;
  className?: string;
  showDemoMarker?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  onSeek,
  isPurchased = true,
  className = '',
  showDemoMarker = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgressPercent, setDragProgressPercent] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const safeDuration = Math.max(1, duration || 210);
  const currentPercent = Math.min(100, Math.max(0, (currentTime / safeDuration) * 100));
  const displayPercent = isDragging && dragProgressPercent !== null ? dragProgressPercent : currentPercent;

  const displayCurrentTime = isDragging && dragProgressPercent !== null
    ? (dragProgressPercent / 100) * safeDuration
    : currentTime;

  const formatTime = (rawSecs: number | undefined | null) => {
    if (rawSecs === undefined || rawSecs === null || isNaN(rawSecs) || !isFinite(rawSecs) || rawSecs < 0) {
      return '00:00';
    }
    const totalSecs = Math.floor(rawSecs);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const calculatePercentFromEvent = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const pct = Math.min(100, Math.max(0, (clickX / rect.width) * 100));
      return pct;
    },
    []
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    const pct = calculatePercentFromEvent(e.clientX);
    setDragProgressPercent(pct);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const movedPct = calculatePercentFromEvent(moveEvent.clientX);
      setDragProgressPercent(movedPct);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      const finalPct = calculatePercentFromEvent(upEvent.clientX);
      const targetSecs = (finalPct / 100) * safeDuration;
      onSeek(targetSecs);
      setIsDragging(false);
      setDragProgressPercent(null);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  return (
    <div className={`w-full flex flex-col gap-2 select-none ${className}`}>
      {/* Outer interactive hit area */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        className="relative w-full h-4 flex items-center cursor-pointer group py-1"
        role="slider"
        aria-valuemin={0}
        aria-valuemax={safeDuration}
        aria-valuenow={displayCurrentTime}
      >
        {/* Background Track with rounded pill styling */}
        <div className="w-full h-1.5 sm:h-2 bg-white/20 dark:bg-white/15 rounded-full overflow-hidden relative shadow-inner">
          {/* Animated Solid White Fill Bar matching Screenshot 3 */}
          <div
            className={`h-full bg-white rounded-full ${
              isDragging ? '' : 'transition-[width] duration-300 ease-out'
            } shadow-[0_0_8px_rgba(255,255,255,0.4)]`}
            style={{ width: `${displayPercent}%` }}
          />
        </div>

        {/* 60-Second Demo Cutoff Marker for unpurchased tracks */}
        {showDemoMarker && !isPurchased && safeDuration > 60 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -ml-1 pointer-events-none z-10"
            style={{ left: `${(60 / safeDuration) * 100}%` }}
            title="Giới hạn nghe thử demo 60s"
          >
            <div className="w-2 h-2 rounded-full bg-amber-400 border border-black shadow-[0_0_6px_#f59e0b]" />
          </div>
        )}
      </div>

      {/* Timestamps directly below: Left is elapsed (01:15), Right is duration (03:45) */}
      <div className="flex items-center justify-between text-xs sm:text-[13px] text-white/70 font-mono tabular-nums tracking-wider px-0.5">
        <span>{formatTime(displayCurrentTime)}</span>
        <span>{formatTime(safeDuration)}</span>
      </div>
    </div>
  );
};
