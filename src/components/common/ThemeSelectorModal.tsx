import React from 'react';
import { X, Check } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ThemeId } from '../../types/music';

interface ThemeOption {
  id: ThemeId;
  name: string;
  previewBg: string;
  previewAccent: string;
  tag: string;
}

const THEMES: ThemeOption[] = [
  {
    id: 'purple',
    name: 'Tím Zing MP3 (Mặc định)',
    previewBg: 'bg-[#170f23]',
    previewAccent: 'bg-[#9b4de0]',
    tag: 'Đặc trưng',
  },
  {
    id: 'blue',
    name: 'Xanh Đêm (Midnight)',
    previewBg: 'bg-[#0f1a2e]',
    previewAccent: 'bg-[#3b82f6]',
    tag: 'Hiện đại',
  },
  {
    id: 'sunset',
    name: 'Hoàng Hôn (Sunset)',
    previewBg: 'bg-[#1e131d]',
    previewAccent: 'bg-[#ec4899]',
    tag: 'Ấm áp',
  },
  {
    id: 'light',
    name: 'Giao Diện Sáng (Clean Light)',
    previewBg: 'bg-[#f1f5f9]',
    previewAccent: 'bg-[#8b5cf6]',
    tag: 'Thanh lịch',
  },
];

export const ThemeSelectorModal: React.FC = () => {
  const { theme, setTheme, isThemeModalOpen, setIsThemeModalOpen } = useMusic();

  if (!isThemeModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#231b2e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-6 text-white">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <h2 className="text-xl font-bold tracking-tight">Giao Diện Zing MP3</h2>
          <button
            onClick={() => setIsThemeModalOpen(false)}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="mt-3 text-sm text-white/70">
          Chọn chủ đề màu sắc yêu thích cho trải nghiệm nghe nhạc của bạn.
        </p>

        <div className="grid grid-cols-2 gap-4 mt-6">
          {THEMES.map((item) => {
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTheme(item.id);
                  setIsThemeModalOpen(false);
                }}
                className={`relative flex flex-col p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#9b4de0] ring-2 ring-[#9b4de0]/40 bg-white/5'
                    : 'border-white/10 hover:border-white/30 bg-black/20'
                }`}
              >
                <div
                  className={`w-full h-20 rounded-lg ${item.previewBg} p-3 flex flex-col justify-between border border-white/10 relative overflow-hidden`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`w-8 h-2.5 rounded-full ${item.previewAccent}`} />
                    <span className="w-12 h-1.5 rounded-full bg-white/20" />
                  </div>

                  {isSelected && (
                    <div className="absolute inset-0 bg-[#9b4de0]/20 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="w-7 h-7 rounded-full bg-[#9b4de0] flex items-center justify-center text-white shadow-md">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate">{item.name}</span>
                  </div>
                  <span className="text-xs text-white/50">{item.tag}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsThemeModalOpen(false)}
            className="px-5 py-2 text-sm font-medium bg-[#9b4de0] hover:bg-[#8539c9] text-white rounded-lg transition-colors shadow-lg shadow-[#9b4de0]/20"
          >
            Áp dụng
          </button>
        </div>
      </div>
    </div>
  );
};
