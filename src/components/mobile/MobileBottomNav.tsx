import React from 'react';
import { ListMusic, ShoppingBag, ShieldCheck, TrendingUp, FolderHeart, User } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ActiveMobileTab } from '../../types/music';

interface NavItemConfig {
  id: ActiveMobileTab;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
  inactiveColor: string;
  glowColor: string;
  dotColor: string;
}

export const MobileBottomNav: React.FC = () => {
  const { activeMobileTab, setActiveMobileTab, isAdmin } = useMusic();

  // Navigation items: each section has its own distinctive, vibrant color!
  const navConfigs: NavItemConfig[] = [
    {
      id: 'discover',
      label: 'Bài Hát',
      icon: <ListMusic className="w-5 h-5" />,
      activeColor: 'text-[#f43f5e]', // Neon Rose / Pink
      inactiveColor: 'text-rose-400/50 hover:text-rose-400/80',
      glowColor: 'drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]',
      dotColor: 'bg-[#f43f5e]',
    },
    {
      id: 'store',
      label: 'Cửa Hàng',
      icon: <ShoppingBag className="w-5 h-5" />,
      activeColor: 'text-[#10b981]', // Mint Emerald Green
      inactiveColor: 'text-emerald-400/50 hover:text-emerald-400/80',
      glowColor: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]',
      dotColor: 'bg-[#10b981]',
    },
    {
      id: 'chart',
      label: '#xuankenchart',
      icon: <TrendingUp className="w-5 h-5" />,
      activeColor: 'text-[#06b6d4]', // Electric Cyan
      inactiveColor: 'text-cyan-400/50 hover:text-cyan-400/80',
      glowColor: 'drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]',
      dotColor: 'bg-[#06b6d4]',
    },
    {
      id: 'library',
      label: 'Thư Viện',
      icon: <FolderHeart className="w-5 h-5" />,
      activeColor: 'text-[#f59e0b]', // Golden Amber
      inactiveColor: 'text-amber-400/50 hover:text-amber-400/80',
      glowColor: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]',
      dotColor: 'bg-[#f59e0b]',
    },
  ];

  // If user is Admin, insert Admin tab with luxury Gold/Yellow color
  if (isAdmin) {
    navConfigs.push({
      id: 'admin',
      label: 'Admin',
      icon: <ShieldCheck className="w-5 h-5" />,
      activeColor: 'text-[#facc15]', // Royal Gold
      inactiveColor: 'text-yellow-400/60 hover:text-yellow-400/90',
      glowColor: 'drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]',
      dotColor: 'bg-[#facc15]',
    });
  }

  // Always add Cá Nhân at the end with Zing Neon Purple
  navConfigs.push({
    id: 'profile',
    label: 'Cá Nhân',
    icon: <User className="w-5 h-5" />,
    activeColor: 'text-[#c084fc]', // Violet Purple
    inactiveColor: 'text-purple-400/50 hover:text-purple-400/80',
    glowColor: 'drop-shadow-[0_0_8px_rgba(192,132,252,0.7)]',
    dotColor: 'bg-[#c084fc]',
  });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md border-t px-1 select-none transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-player)', borderColor: 'var(--border-color)' }}
    >
      <div
        className={`grid ${
          isAdmin ? 'grid-cols-6' : 'grid-cols-5'
        } items-center h-14 max-w-md mx-auto`}
      >
        {navConfigs.map((item) => {
          const isActive = activeMobileTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveMobileTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 transition-all ${
                isActive ? `${item.activeColor} ${item.glowColor}` : item.inactiveColor
              }`}
            >
              <span className={`transition-transform duration-200 ${isActive ? 'scale-115' : 'scale-100'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] font-bold tracking-tight mt-0.5 truncate max-w-full px-0.5 ${
                isActive ? 'font-black' : 'font-medium'
              }`}>
                {item.label}
              </span>
              {isActive && (
                <span className={`w-1 h-1 rounded-full ${item.dotColor} mt-0.5 shadow-sm`} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
