import React from 'react';
import { X, Check, Palette } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ThemeId } from '../../types/music';

interface ThemeOption {
  id: ThemeId;
  name: string;
  previewBg: string;
  previewAccent: string;
  tag: string;
  description: string;
}

const THEMES: ThemeOption[] = [
  {
    id: 'purple',
    name: 'Tím Zing MP3',
    previewBg: 'bg-[#120822]',
    previewAccent: 'bg-[#9b4de0]',
    tag: 'Mặc định',
    description: 'Phong cách tím Zing MP3 sâu lắng, huyền ảo',
  },
  {
    id: 'blue',
    name: 'Xanh Biển Sâu (Ocean)',
    previewBg: 'bg-[#0a1128]',
    previewAccent: 'bg-[#06b6d4]',
    tag: 'Hiện đại',
    description: 'Xanh dương đại dương đêm sâu & neon cyan',
  },
  {
    id: 'sunset',
    name: 'Hoàng Hôn Cyberpunk',
    previewBg: 'bg-[#18091d]',
    previewAccent: 'bg-[#f43f5e]',
    tag: 'Rực rỡ',
    description: 'Sắc hồng neon & cam đỏ hoàng hôn ấm áp',
  },
  {
    id: 'emerald',
    name: 'Lục Bảo Dạ Quang',
    previewBg: 'bg-[#04140e]',
    previewAccent: 'bg-[#10b981]',
    tag: 'Tươi mới',
    description: 'Xanh ngọc lục bảo ma mị, mát mẻ thư giãn',
  },
  {
    id: 'gold',
    name: 'Hoàng Gia Luxury',
    previewBg: 'bg-[#12100b]',
    previewAccent: 'bg-[#eab308]',
    tag: 'Sang trọng',
    description: 'Màu vàng hoàng kim vương giả & thạch anh đen',
  },
  {
    id: 'dark',
    name: 'Đen Thuần Khiết (AMOLED)',
    previewBg: 'bg-[#000000]',
    previewAccent: 'bg-[#e2e8f0]',
    tag: 'Tiết kiệm pin',
    description: 'Đen tuyệt đối chuẩn màn hình AMOLED cao cấp',
  },
  {
    id: 'rose',
    name: 'Hồng Ruby (Sakura)',
    previewBg: 'bg-[#1c0813]',
    previewAccent: 'bg-[#fb7185]',
    tag: 'Lãng mạn',
    description: 'Sắc hồng hoa anh đào dịu ngọt, lãng mạn',
  },
  {
    id: 'light',
    name: 'Bạch Kim Sáng (Minimal)',
    previewBg: 'bg-[#f8fafc]',
    previewAccent: 'bg-[#8b5cf6]',
    tag: 'Thanh lịch',
    description: 'Giao diện sáng sủa, tinh tế phong cách hiện đại',
  },
];

export const ThemeSelectorModal: React.FC = () => {
  const { theme, setTheme, isThemeModalOpen, setIsThemeModalOpen } = useMusic();

  if (!isThemeModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className="w-full max-w-xl border rounded-3xl shadow-2xl overflow-hidden p-4 sm:p-6 text-white max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#9b4de0]/20 text-[#c273ed] flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">Chủ Đề & Giao Diện</h2>
              <p className="text-[11px] text-white/50">8 phong cách màu sắc độc quyền cho XuanKen Music</p>
            </div>
          </div>
          <button
            onClick={() => setIsThemeModalOpen(false)}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mt-4 overflow-y-auto pr-1 flex-1 py-1">
          {THEMES.map((item) => {
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTheme(item.id);
                }}
                className={`relative flex flex-col p-3 rounded-2xl border text-left transition-all active:scale-98 ${
                  isSelected
                    ? 'border-[#9b4de0] ring-2 ring-[#9b4de0]/50 bg-white/10 shadow-lg'
                    : 'border-white/10 hover:border-white/30 bg-black/20 hover:bg-white/5'
                }`}
              >
                {/* Theme Card Preview */}
                <div
                  className={`w-full h-16 sm:h-20 rounded-xl ${item.previewBg} p-2.5 flex flex-col justify-between border border-white/15 relative overflow-hidden shadow-inner`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500/80" />
                    <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                    <span className="w-2 h-2 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`w-8 sm:w-10 h-2.5 rounded-full ${item.previewAccent} shadow-sm`} />
                    <span className="w-10 h-1.5 rounded-full bg-white/20" />
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#9b4de0]/25 flex items-center justify-center backdrop-blur-[1px]">
                      <div className="w-7 h-7 rounded-full bg-[#9b4de0] flex items-center justify-center text-white shadow-lg ring-2 ring-white">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme Info */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm font-bold truncate text-white">
                      {item.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/70 font-semibold shrink-0">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/50 line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between shrink-0">
          <span className="text-xs text-white/50">
            Chủ đề hiện tại: <strong className="text-white capitalize">{theme}</strong>
          </span>
          <button
            onClick={() => setIsThemeModalOpen(false)}
            style={{ backgroundColor: 'var(--color-accent)' }}
            className="px-5 py-2 text-xs font-bold text-white rounded-xl transition-opacity hover:opacity-90 shadow-lg"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
