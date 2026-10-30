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
    setSleepTimerSeconds,
  } = useMusic();

  const [customHours, setCustomHours] = useState<string>('0');
  const [customMinutes, setCustomMinutes] = useState<string>('20');
  const [customSeconds, setCustomSeconds] = useState<string>('0');

  if (!isSleepTimerModalOpen) return null;

  const quickPresets = [
    { label: '15 phút', fullLabel: '00:15:00', totalSeconds: 15 * 60 },
    { label: '30 phút', fullLabel: '00:30:00', totalSeconds: 30 * 60 },
    { label: '45 phút', fullLabel: '00:45:00', totalSeconds: 45 * 60 },
    { label: '1 giờ', fullLabel: '01:00:00', totalSeconds: 60 * 60 },
    { label: '1h 30p', fullLabel: '01:30:00', totalSeconds: 90 * 60 },
    { label: '2 giờ', fullLabel: '02:00:00', totalSeconds: 120 * 60 },
  ];

  const formatRemainingDetailed = (totalSecs: number) => {
    const total = Math.max(0, Math.floor(totalSecs));
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return {
      digital: `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
      text: `${hrs.toString().padStart(2, '0')} giờ ${mins.toString().padStart(2, '0')} phút ${secs.toString().padStart(2, '0')} giây`,
    };
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = Math.max(0, parseInt(customHours, 10) || 0);
    const m = Math.max(0, parseInt(customMinutes, 10) || 0);
    const s = Math.max(0, parseInt(customSeconds, 10) || 0);
    const totalSecs = h * 3600 + m * 60 + s;
    if (totalSecs > 0) {
      setSleepTimerSeconds(totalSecs);
      setIsSleepTimerModalOpen(false);
    }
  };

  const remainingInfo =
    sleepTimerRemainingSeconds !== null && sleepTimerRemainingSeconds > 0
      ? formatRemainingDetailed(sleepTimerRemainingSeconds)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[#231b2e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 text-white space-y-5 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#9b4de0]/20 text-[#c273ed] flex items-center justify-center shadow">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Hẹn Giờ Tắt Nhạc</h2>
              <p className="text-[11px] text-white/50">Tự động dừng phát nhạc sau thời gian đặt</p>
            </div>
          </div>
          <button
            onClick={() => setIsSleepTimerModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Active Countdown Display with FULL Hours, Minutes, Seconds */}
        {remainingInfo && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 via-purple-600/20 to-indigo-900/30 border border-purple-500/40 flex items-center justify-between shadow-lg">
            <div className="space-y-0.5">
              <p className="text-[11px] text-[#c273ed] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Đang đếm ngược tắt nhạc</span>
              </p>
              <p className="text-2xl font-black text-amber-300 font-mono tracking-wider tabular-nums">
                {remainingInfo.digital}
              </p>
              <p className="text-xs text-white/80 font-medium">
                {remainingInfo.text}
              </p>
            </div>
            <button
              onClick={() => setSleepTimer(null)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30 transition-all active:scale-95 shrink-0"
            >
              <BellOff className="w-3.5 h-3.5" />
              <span>Hủy hẹn giờ</span>
            </button>
          </div>
        )}

        {/* Quick Presets with Full Hours, Minutes, Seconds */}
        <div>
          <p className="text-xs font-bold text-white/70 mb-2.5 uppercase tracking-wider">
            Chọn thời gian cài sẵn
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {quickPresets.map((preset) => {
              const isCurrent =
                sleepTimerRemainingSeconds !== null &&
                Math.abs(sleepTimerRemainingSeconds - preset.totalSeconds) < 2;
              return (
                <button
                  key={preset.totalSeconds}
                  onClick={() => {
                    setSleepTimerSeconds(preset.totalSeconds);
                    setIsSleepTimerModalOpen(false);
                  }}
                  className={`py-3 px-2 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
                    isCurrent
                      ? 'border-[#9b4de0] bg-[#9b4de0]/25 text-white shadow-lg ring-2 ring-purple-400/40'
                      : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/80'
                  }`}
                >
                  <span className="text-sm font-bold">{preset.label}</span>
                  <span className="text-[10px] text-white/50 font-mono font-medium">
                    {preset.fullLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Hours, Minutes, Seconds Setup */}
        <form onSubmit={handleCustomSubmit} className="pt-4 border-t border-white/10 space-y-3">
          <p className="text-xs font-bold text-white/70 uppercase tracking-wider">
            Tùy chỉnh đầy đủ Giờ • Phút • Giây
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-white/50 mb-1">Giờ</label>
              <div className="flex items-center bg-black/40 border border-white/15 rounded-xl px-2.5 py-2 focus-within:border-[#9b4de0]">
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={customHours}
                  onChange={(e) => setCustomHours(e.target.value)}
                  className="w-full bg-transparent text-white font-mono text-center font-bold text-sm focus:outline-none"
                />
                <span className="text-[10px] text-white/40 ml-1">giờ</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/50 mb-1">Phút</label>
              <div className="flex items-center bg-black/40 border border-white/15 rounded-xl px-2.5 py-2 focus-within:border-[#9b4de0]">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-full bg-transparent text-white font-mono text-center font-bold text-sm focus:outline-none"
                />
                <span className="text-[10px] text-white/40 ml-1">phút</span>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-white/50 mb-1">Giây</label>
              <div className="flex items-center bg-black/40 border border-white/15 rounded-xl px-2.5 py-2 focus-within:border-[#9b4de0]">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={customSeconds}
                  onChange={(e) => setCustomSeconds(e.target.value)}
                  className="w-full bg-transparent text-white font-mono text-center font-bold text-sm focus:outline-none"
                />
                <span className="text-[10px] text-white/40 ml-1">giây</span>
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-500/30 transition-transform active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Kích hoạt hẹn giờ ({customHours.padStart(2, '0')}:{customMinutes.padStart(2, '0')}:{customSeconds.padStart(2, '0')})</span>
          </button>
        </form>
      </div>
    </div>
  );
};
