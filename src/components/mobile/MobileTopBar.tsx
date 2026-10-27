import React from 'react';
import { Search, Bell, Palette, Wallet } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ActiveMobileTab } from '../../types/music';

export const MobileTopBar: React.FC = () => {
  const {
    activeMobileTab,
    setActiveMobileTab,
    searchQuery,
    setSearchQuery,
    setIsThemeModalOpen,
    userBalance,
    setIsTopUpModalOpen,
  } = useMusic();

  const tabs: { id: ActiveMobileTab; label: string }[] = [
    { id: 'discover', label: 'Bài Hát' },
    { id: 'store', label: 'Cửa Hàng' },
    { id: 'admin', label: 'Admin' },
    { id: 'chart', label: '#zingchart' },
    { id: 'library', label: 'Thư Viện' },
  ];

  return (
    <div className="sticky top-0 z-30 bg-[#170f23]/95 backdrop-blur-md border-b border-white/5 text-white select-none">
      {/* Top Search & Actions Row */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2.5">
        {/* User avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 ring-2 ring-[#9b4de0] flex items-center justify-center text-xs font-black shrink-0">
          XK
        </div>

        {/* Search Bar Input */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs">
          <Search className="w-3.5 h-3.5 text-white/50 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm bài hát, ca sỹ, file LRC..."
            className="w-full bg-transparent text-white placeholder-white/40 focus:outline-none text-xs"
          />
        </div>

        {/* Wallet Balance */}
        <button
          onClick={() => setIsTopUpModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold shrink-0"
        >
          <Wallet className="w-3.5 h-3.5" />
          <span>{Math.round(userBalance / 1000)}k</span>
        </button>

        {/* Theme */}
        <button
          onClick={() => setIsThemeModalOpen(true)}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/70"
          title="Đổi chủ đề"
        >
          <Palette className="w-4 h-4" />
        </button>
      </div>

      {/* Segmented Top Tabs */}
      <div className="flex items-center px-4 gap-5 overflow-x-auto no-scrollbar text-xs font-bold border-t border-white/5">
        {tabs.map((tab) => {
          const isActive = activeMobileTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMobileTab(tab.id)}
              className={`py-2 whitespace-nowrap transition-all relative ${
                isActive ? 'text-white' : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9b4de0] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
