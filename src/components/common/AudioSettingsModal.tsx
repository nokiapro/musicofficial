import React from 'react';
import { X, Waves, Smartphone, Check } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const AudioSettingsModal: React.FC = () => {
  const {
    isAudioSettingsModalOpen,
    setIsAudioSettingsModalOpen,
    crossfadeDuration,
    setCrossfadeDuration,
  } = useMusic();

  if (!isAudioSettingsModalOpen) return null;

  const crossfadeOptions = [
    { sec: 0, label: 'Tắt (0s)' },
    { sec: 2, label: '2 giây' },
    { sec: 3, label: '3s (Chuẩn)' },
    { sec: 5, label: '5 giây' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-5 sm:p-6 text-white space-y-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Nối Nhạc Mượt Mà (Crossfade)</h2>
              <p className="text-[11px] text-white/50">Tự động hòa trộn âm thanh khi chuyển bài</p>
            </div>
          </div>
          <button
            onClick={() => setIsAudioSettingsModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Crossfade Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-emerald-400" />
              <span>Thời gian hòa trộn</span>
            </label>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
              {crossfadeDuration === 0 ? 'Đang tắt' : `${crossfadeDuration} giây`}
            </span>
          </div>
          <p className="text-[11px] text-white/60 leading-relaxed">
            Khi bật Crossfade, âm lượng bài hát cũ sẽ nhỏ dần và bài hát tiếp theo sẽ lớn dần lên, tạo cảm giác liền mạch như nghe nhạc tại quán cà phê hoặc sân khấu.
          </p>
          <div className="grid grid-cols-4 gap-2">
            {crossfadeOptions.map((opt) => {
              const isSelected = crossfadeDuration === opt.sec;
              return (
                <button
                  key={opt.sec}
                  onClick={() => setCrossfadeDuration(opt.sec)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-white shadow-md ring-2 ring-emerald-400/40'
                      : 'bg-white/5 hover:bg-white/10 text-white/70'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Media Session API Lockscreen Info */}
        <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="text-xs space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span>Điều khiển màn hình khóa</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase">
                Hoạt động
              </span>
            </div>
            <p className="text-[11px] text-white/50">
              Media Session API tự động hiển thị tên bài hát, ảnh bìa và nút Play/Next trên thanh thông báo & màn hình khóa điện thoại.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => setIsAudioSettingsModalOpen(false)}
            className="px-5 py-2 text-xs font-bold bg-[#9b4de0] hover:bg-[#8539c9] text-white rounded-xl shadow-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
