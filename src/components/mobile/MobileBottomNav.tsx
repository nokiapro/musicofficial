import React from 'react';
import { ListMusic, ShoppingBag, ShieldCheck, TrendingUp, FolderHeart } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ActiveMobileTab } from '../../types/music';

export const MobileBottomNav: React.FC = () => {
  const { activeMobileTab, setActiveMobileTab } = useMusic();

  const navItems: { id: ActiveMobileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'discover', label: 'Bài Hát', icon: <ListMusic className="w-5 h-5" /> },
    { id: 'store', label: 'Cửa Hàng', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'admin', label: 'Admin', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'chart', label: '#zingchart', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'library', label: 'Thư Viện', icon: <FolderHeart className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#170f23]/95 backdrop-blur-md border-t border-white/10 px-2 select-none">
      <div className="grid grid-cols-5 items-center h-14 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = activeMobileTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveMobileTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 transition-all ${
                isActive ? 'text-[#c273ed]' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold tracking-tight mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
