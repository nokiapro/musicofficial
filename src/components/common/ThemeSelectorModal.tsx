import React, { useState } from 'react';
import { X, Check, Palette, Moon, Sun } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ThemeId } from '../../types/music';

interface ThemeOption {
  id: ThemeId;
  name: string;
  bgColor: string;
  accentColor: string;
  tag: string;
  description: string;
  isLight?: boolean;
}

const DARK_THEMES: ThemeOption[] = [
  {
    id: 'zma',
    name: 'Zing Music Awards',
    bgColor: '#100a20',
    accentColor: '#e5ac25',
    tag: 'Đặc biệt',
    description: 'Phong cách ZMA huyền ảo, ánh vàng vinh danh',
  },
  {
    id: 'dark',
    name: 'Tối',
    bgColor: '#121212',
    accentColor: '#8b5cf6',
    tag: 'Tối giản',
    description: 'Đen than charcoal thanh lịch, tiết kiệm pin',
  },
  {
    id: 'purple',
    name: 'Tím',
    bgColor: '#170f23',
    accentColor: '#9b4de0',
    tag: 'Mặc định',
    description: 'Tím Zing MP3 thương hiệu sâu lắng và huyền bí',
  },
  {
    id: 'dark-blue',
    name: 'Xanh Đậm',
    bgColor: '#0d192b',
    accentColor: '#2563eb',
    tag: 'Trầm tĩnh',
    description: 'Xanh navy thẫm đại dương sâu lắng',
  },
  {
    id: 'blue',
    name: 'Xanh Biển',
    bgColor: '#061d33',
    accentColor: '#06b6d4',
    tag: 'Tươi mát',
    description: 'Sắc xanh biển sâu neon cyan phóng khoáng',
  },
  {
    id: 'green',
    name: 'Xanh Lá',
    bgColor: '#062117',
    accentColor: '#10b981',
    tag: 'Thư giãn',
    description: 'Xanh ngọc lục bảo rừng nhiệt đới mát rượi',
  },
  {
    id: 'brown',
    name: 'Nâu',
    bgColor: '#211510',
    accentColor: '#d97706',
    tag: 'Ấm áp',
    description: 'Sắc nâu cà phê ấm cúng phong vị acoustic',
  },
  {
    id: 'pink',
    name: 'Hồng',
    bgColor: '#2b0f22',
    accentColor: '#ec4899',
    tag: 'Lãng mạn',
    description: 'Tím hồng dâu tây ngọt ngào, mộng mơ',
  },
  {
    id: 'red',
    name: 'Đỏ',
    bgColor: '#280b11',
    accentColor: '#e11d48',
    tag: 'Cuồng nhiệt',
    description: 'Sắc đỏ rượu vang quý phái, bùng cháy đam mê',
  },
  {
    id: 'sunset',
    name: 'Hoàng Hôn',
    bgColor: '#250f1e',
    accentColor: '#f43f5e',
    tag: 'Rực rỡ',
    description: 'Ánh hoàng hôn lãng mạn chiều tà',
  },
  {
    id: 'emerald',
    name: 'Lục Bảo',
    bgColor: '#042018',
    accentColor: '#10b981',
    tag: 'Ngọc bích',
    description: 'Xanh ngọc emerald quý phái sang trọng',
  },
  {
    id: 'gold',
    name: 'Hoàng Gia',
    bgColor: '#1f1807',
    accentColor: '#eab308',
    tag: 'Quyền quý',
    description: 'Vàng kim hoàng gia quý tộc',
  },
  {
    id: 'rose',
    name: 'Hồng Ruby',
    bgColor: '#290d18',
    accentColor: '#fb7185',
    tag: 'Nổi bật',
    description: 'Hồng ruby kiêu sa, quyến rũ',
  },
];

const LIGHT_THEMES: ThemeOption[] = [
  {
    id: 'light',
    name: 'Sáng',
    bgColor: '#ffffff',
    accentColor: '#7c3aed',
    tag: 'Trang nhã',
    description: 'Tone trắng tinh khôi hiện đại, rõ nét',
    isLight: true,
  },
  {
    id: 'gray',
    name: 'Xám',
    bgColor: '#f1f5f9',
    accentColor: '#475569',
    tag: 'Tinh tế',
    description: 'Xám khói thanh lịch dịu mắt cho ban ngày',
    isLight: true,
  },
  {
    id: 'light-blue',
    name: 'Xanh Nhạt',
    bgColor: '#e0f2fe',
    accentColor: '#0284c7',
    tag: 'Bầu trời',
    description: 'Xanh mây trời pastel trong trẻo, êm dịu',
    isLight: true,
  },
  {
    id: 'lotus-pink',
    name: 'Hồng Cánh Sen',
    bgColor: '#fce7f3',
    accentColor: '#db2777',
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
      className={`fixed inset-0 z-[100000] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md select-none duration-350 ease-out font-['Roboto_Condensed'] ${
        isClosing ? 'animate-out fade-out' : 'animate-in fade-in'
      }`}
    >
      <div
        data-theme={theme}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-xl border rounded-3xl shadow-2xl overflow-hidden p-4 sm:p-6 max-h-[90vh] flex flex-col duration-350 ease-out font-['Roboto_Condensed'] ${
          isClosing ? 'animate-out zoom-out-95' : 'animate-in zoom-in-95'
        }`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[var(--border-color)] shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--color-accent)' }}
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
            >
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">Chủ Đề & Giao Diện</h2>
              <p className="text-[11px] text-[var(--text-secondary)]">13 bộ giao diện Zing MP3 chính thức (Tối & Sáng)</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs: Màu Tối vs Màu Sáng */}
        <div className="flex items-center gap-2 mt-4 p-1 rounded-2xl bg-[var(--bg-surface-hover)] border border-[var(--border-color)] shrink-0">
          <button
            onClick={() => setActiveCategory('dark')}
            style={activeCategory === 'dark' ? { backgroundColor: 'var(--color-accent)', color: '#ffffff' } : undefined}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'dark'
                ? 'shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Màu Tối ({DARK_THEMES.length})</span>
          </button>

          <button
            onClick={() => setActiveCategory('light')}
            style={activeCategory === 'light' ? { backgroundColor: 'var(--color-accent)', color: '#ffffff' } : undefined}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeCategory === 'light'
                ? 'shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
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
                style={
                  isSelected
                    ? { borderColor: 'var(--color-accent)', boxShadow: '0 0 0 2px var(--color-accent)' }
                    : undefined
                }
                className={`relative flex flex-col p-3 rounded-2xl border text-left transition-all active:scale-98 cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--bg-surface-hover)] shadow-lg'
                    : 'border-[var(--border-color)] hover:border-[var(--color-accent)] bg-[var(--bg-surface-hover)]/60 hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {/* Theme Card Preview with explicit inline hex background */}
                <div
                  style={{ backgroundColor: item.bgColor }}
                  className="w-full h-16 sm:h-20 rounded-xl p-2.5 flex flex-col justify-between border border-black/10 relative overflow-hidden shadow-inner"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500/80" />
                    <span className="w-2 h-2 rounded-full bg-yellow-500/80" />
                    <span className="w-2 h-2 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span
                      style={{ backgroundColor: item.accentColor }}
                      className="w-8 sm:w-10 h-2.5 rounded-full shadow-sm"
                    />
                    <span className={`w-10 h-1.5 rounded-full ${item.isLight ? 'bg-black/20' : 'bg-white/20'}`} />
                  </div>

                  {isSelected && (
                    <div
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.35)' }}
                      className="absolute inset-0 flex items-center justify-center backdrop-blur-[1px]"
                    >
                      <div
                        style={{ backgroundColor: item.accentColor }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white shadow-lg ring-2 ring-white"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme Info */}
                <div className="mt-2.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs sm:text-sm font-bold truncate text-[var(--text-primary)]">
                      {item.name}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--border-color)] text-[var(--text-secondary)] font-semibold shrink-0">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between shrink-0">
          <span className="text-xs text-[var(--text-secondary)]">
            Chủ đề: <strong className="text-[var(--text-primary)] capitalize">{theme}</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
