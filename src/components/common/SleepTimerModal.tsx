import React, { useState } from 'react';
import { X, Clock, Check, BellOff } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const SleepTimerModal: React.FC = () => {
  const {
    isSleepTimerModalOpen,
    setIsSleepTimerModalOpen,
    sleepTimerMinutes,
    sleepTimerRemainingSeconds,
    setSleepTimer,
  } = useMusic();

  const [customVal, setCustomVal] = useState<string>('20');

  if (!isSleepTimerModalOpen) return null;

  const quickMinutes = [15, 30, 45, 60, 90];

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs < 10 ? '0' : ''}${secs} giây`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#231b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 text-white">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#9b4de0]/20 text-[#c273ed] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Hẹn Giờ Tắt Nhạc</h2>
          </div>
          <button
            onClick={() => setIsSleepTimerModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {sleepTimerRemainingSeconds !== null && sleepTimerRemainingSeconds > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-[#9b4de0]/15 border border-[#9b4de0]/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#c273ed] font-medium">Đang đếm ngược</p>
              <p className="text-base font-bold text-white tabular-nums">
                {formatRemaining(sleepTimerRemainingSeconds)}
              </p>
            </div>
            <button
              onClick={() => setSleepTimer(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
            >
              <BellOff className="w-3.5 h-3.5" />
              Hủy hẹn giờ
            </button>
          </div>
        )}

        <div className="mt-5">
          <p className="text-xs font-medium text-white/60 mb-3 uppercase tracking-wider">
            Chọn thời gian tắt nhạc
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {quickMinutes.map((mins) => {
              const isCurrent = sleepTimerMinutes === mins;
              return (
                <button
                  key={mins}
                  onClick={() => {
                    setSleepTimer(mins);
                    setIsSleepTimerModalOpen(false);
                  }}
                  className={`py-3 px-3 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'border-[#9b4de0] bg-[#9b4de0]/20 text-white font-semibold'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  <span className="text-sm">{mins} phút</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-xs font-medium text-white/60 mb-2">Tùy chỉnh số phút</p>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max="360"
              value={customVal}
              onChange={(e) => setCustomVal(e.target.value)}
              placeholder="Nhập số phút"
              className="flex-1 bg-white/5 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#9b4de0]"
            />
            <button
              onClick={() => {
                const parsed = parseInt(customVal, 10);
                if (parsed > 0) {
                  setSleepTimer(parsed);
                  setIsSleepTimerModalOpen(false);
                }
              }}
              className="px-4 py-2 bg-[#9b4de0] hover:bg-[#8539c9] text-white text-sm font-medium rounded-xl transition-colors"
            >
              Đặt hẹn giờ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
