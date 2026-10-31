import React, { useState } from 'react';
import { X, Check, Palette, Moon, Sun } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ThemeId } from '../../types/music';

interface ThemeOption {
  id: ThemeId;
  name: string;
  previewBg: string;
  previewAccent: string;
  tag: string;
  description: string;
  isLight?: boolean;
}

const DARK_THEMES: ThemeOption[] = [
  {
    id: 'zma',
    name: 'Zing Music Awards',
    previewBg: 'bg-[#100a20]',
    previewAccent: 'bg-[#e5ac25]',
    tag: 'Đặc biệt',
    description: 'Phong cách ZMA huyền ảo, ánh vàng vinh danh',
  },
  {
    id: 'dark',
    name: 'Tối',
    previewBg: 'bg-[#121212]',
    previewAccent: 'bg-[#8b5cf6]',
    tag: 'Tối giản',
    description: 'Đen than charcoal thanh lịch, tiết kiệm pin',
  },
  {
    id: 'purple',
    name: 'Tím',
    previewBg: 'bg-[#170f23]',
    previewAccent: 'bg-[#9b4de0]',
    tag: 'Mặc định',
    description: 'Tím Zing MP3 thương hiệu sâu lắng và huyền bí',
  },
  {
    id: 'dark-blue',
    name: 'Xanh Đậm',
    previewBg: 'bg-[#0d192b]',
    previewAccent: 'bg-[#2563eb]',
    tag: 'Trầm tĩnh',
    description: 'Xanh navy thẫm đại dương sâu lắng',
  },
  {
    id: 'blue',
    name: 'Xanh Biển',
    previewBg: 'bg-[#061d33]',
    previewAccent: 'bg-[#06b6d4]',
    tag: 'Tươi mát',
    description: 'Sắc xanh biển sâu neon cyan phóng khoáng',
  },
  {
    id: 'green',
    name: 'Xanh Lá',
    previewBg: 'bg-[#062117]',
    previewAccent: 'bg-[#10b981]',
    tag: 'Thư giãn',
    description: 'Xanh ngọc lục bảo rừng nhiệt đới mát rượi',
  },
  {
    id: 'brown',
    name: 'Nâu',
    previewBg: 'bg-[#211510]',
    previewAccent: 'bg-[#d97706]',
    tag: 'Ấm áp',
    description: 'Sắc nâu cà phê ấm cúng phong vị acoustic',
  },
  {
    id: 'pink',
    name: 'Hồng',
    previewBg: 'bg-[#2b0f22]',
    previewAccent: 'bg-[#ec4899]',
    tag: 'Lãng mạn',
    description: 'Tím hồng dâu tây ngọt ngào, mộng mơ',
  },
  {
    id: 'red',
    name: 'Đỏ',
    previewBg: 'bg-[#280b11]',
    previewAccent: 'bg-[#e11d48]',
    tag: 'Cuồng nhiệt',
    description: 'Sắc đỏ rượu vang quý phái, bùng cháy đam mê',
  },
];

const LIGHT_THEMES: ThemeOption[] = [
  {
    id: 'light',
    name: 'Sáng',
    previewBg: 'bg-[#ffffff]',
    previewAccent: 'bg-[#7c3aed]',
    tag: 'Trang nhã',
    description: 'Tone trắng tinh khôi hiện đại, rõ nét',
    isLight: true,
  },
  {
    id: 'gray',
    name: 'Xám',
    previewBg: 'bg-[#f1f5f9]',
    previewAccent: 'bg-[#475569]',
    tag: 'Tinh tế',
    description: 'Xám khói thanh lịch dịu mắt cho ban ngày',
    isLight: true,
  },
  {
    id: 'light-blue',
    name: 'Xanh Nhạt',
    previewBg: 'bg-[#e0f2fe]',
    previewAccent: 'bg-[#0284c7]',
    tag: 'Bầu trời',
    description: 'Xanh mây trời pastel trong trẻo, êm dịu',
    isLight: true,
  },
  {
    id: 'lotus-pink',
    name: 'Hồng Cánh Sen',
    previewBg: 'bg-[#fce7f3]',
    previewAccent: 'bg-[#db2777]',
    tag: 'Dịu dàng',
    description: 'Sắc hồng cánh sen phấn ngọt ngào',
    isLight: true,
  },
];

export const ThemeSelectorModal: React.FC = () => {
  const { theme, setTheme, isThemeModalOpen, setIsThemeModalOpen } = useMusic();
  const [activeCategory, setActiveCategory] = useState<'dark' | 'light'>('dark');
  const [isClosing, setIsClosing] = useState(false);

  if (!isThemeModalOpen) return null;

  const handleClose = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsThemeModalOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const currentThemeList = activeCategory === 'dark' ? DARK_THEMES : LIGHT_THEMES;

  return (
    <div
      onClick={handleClose}
      className={`fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none duration-200 ${
        isClosing ? 'animate-out fade-out' : 'animate-in fade-in'
      }`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl border rounded-3xl shadow-2xl overflow-hidden p-4 sm:p-6 text-white max-h-[90vh] flex flex-col duration-200 ${
          isClosing ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95'
        }`}
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
              <p className="text-[11px] text-white/50">13 bộ giao diện Zing MP3 chính thức (Tối & Sáng)</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Màu Tối vs Màu Sáng */}
        <div className="flex items-center gap-2 mt-4 p-1 rounded-2xl bg-black/20 border border-white/10 shrink-0">
          <button
            onClick={() => setActiveCategory('dark')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'dark'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Màu Tối ({DARK_THEMES.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('light')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'light'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Màu Sáng ({LIGHT_THEMES.length})</span>
          </button>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mt-4 overflow-y-auto pr-1 flex-1 py-1">
          {currentThemeList.map((item) => {
            const isSelected = theme === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTheme(item.id);
                }}
                className={`relative flex flex-col p-3 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer ${
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
                    <span className={`w-10 h-1.5 rounded-full ${item.isLight ? 'bg-black/20' : 'bg-white/20'}`} />
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 bg-[#9b4de0]/30 flex items-center justify-center backdrop-blur-[1px]">
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
            Chủ đề: <strong className="text-white capitalize">{theme}</strong>
          </span>
          <button
            onClick={handleClose}
            style={{ backgroundColor: 'var(--color-accent)' }}
            className="px-5 py-2 text-xs font-bold text-white rounded-xl transition-opacity hover:opacity-90 shadow-lg cursor-pointer"
          >
            Áp Dụng & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
