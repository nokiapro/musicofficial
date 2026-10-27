import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../../services/audioEngine';
import { useMusic } from '../../context/MusicContext';

interface VisualizerProps {
  barCount?: number;
  height?: number;
  className?: string;
  color?: string;
}

export const Visualizer: React.FC<VisualizerProps> = ({
  barCount = 16,
  height = 24,
  className = '',
  color = '#9b4de0',
}) => {
  const { isPlaying } = useMusic();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (isPlaying) {
        const freqData = audioEngine.getFrequencyData();
        const step = Math.floor(freqData.length / barCount);
        const barWidth = (canvas.width / barCount) - 2;

        for (let i = 0; i < barCount; i++) {
          const val = freqData[i * step] || 0;
          // Scale value to canvas height
          const barHeight = Math.max(3, (val / 255) * canvas.height);
          const x = i * (barWidth + 2);
          const y = canvas.height - barHeight;

          // Gradient bar
          const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
          grad.addColorStop(0, color);
          grad.addColorStop(1, '#c084fc');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
          ctx.fill();
        }
      } else {
        // Flat quiet state
        const barWidth = (canvas.width / barCount) - 2;
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.fillRect(x, canvas.height - 2, barWidth, 2);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, barCount, color]);

  return (
    <canvas
      ref={canvasRef}
      width={barCount * 6}
      height={height}
      className={`inline-block ${className}`}
    />
  );
};
