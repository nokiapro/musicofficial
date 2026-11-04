import React from 'react';

interface SoundWaveIconProps {
  isPlaying?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  withBackground?: boolean;
}

export const SoundWaveIcon: React.FC<SoundWaveIconProps> = ({
  isPlaying = true,
  size = 'md',
  color = 'bg-white',
  className = '',
  withBackground = true,
}) => {
  const sizeStyles = {
    xs: {
      container: 'h-2.5 gap-0.5 px-1 py-0.5',
      bar: 'w-[1.5px] rounded-full',
    },
    sm: {
      container: 'h-3 gap-0.5 px-1.5 py-0.5',
      bar: 'w-[2px] rounded-full',
    },
    md: {
      container: 'h-4 gap-1 px-2 py-1',
      bar: 'w-[2.5px] rounded-full',
    },
    lg: {
      container: 'h-5 gap-1 px-2.5 py-1.5',
      bar: 'w-[3px] rounded-full',
    },
  };

  const current = sizeStyles[size];

  return (
    <div
      className={`flex items-end pointer-events-none select-none z-20 ${current.container} ${
        withBackground
          ? 'rounded-lg bg-black/60 backdrop-blur-md border border-white/20 shadow-lg'
          : 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]'
      } ${className}`}
    >
      <span
        style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        className={`${current.bar} ${color} animate-soundwave-1`}
      />
      <span
        style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        className={`${current.bar} ${color} animate-soundwave-2`}
      />
      <span
        style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        className={`${current.bar} ${color} animate-soundwave-3`}
      />
      <span
        style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
        className={`${current.bar} ${color} animate-soundwave-4`}
      />
    </div>
  );
};
