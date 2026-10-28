import React from 'react';
import { Search, X, Palette, Wallet } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const MobileTopBar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    setActiveMobileTab,
    setIsThemeModalOpen,
    setIsTopUpModalOpen,
    setIsAudioSettingsModalOpen,
    userBalance,
    currentUser,
  } = useMusic();

  return (
    <div
      className="sticky top-0 z-30 backdrop-blur-md border-b text-white select-none transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-color)' }}
    >
      {/* Top Search & Actions Row */}
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2">
        {/* User avatar - Click to go to Profile */}
        <button
          onClick={() => setActiveMobileTab('profile')}
          className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-purple-500 to-pink-500 ring-2 ring-[#9b4de0] flex items-center justify-center text-xs font-black shrink-0 active:scale-95 transition-transform"
          title="Xem trang Cá nhân"
        >
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <span>{currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'XK'}</span>
          )}
        </button>

        {/* Search Bar Input with Clear button */}
        <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs focus-within:border-[#9b4de0] focus-within:bg-[#231b2e] transition-all">
          <Search className="w-3.5 h-3.5 text-white/50 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm bài hát, ca sỹ, file LRC..."
            className="w-full bg-transparent text-white placeholder-white/40 focus:outline-none text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-white/40 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Wallet Balance Pill */}
        <button
          onClick={() => setIsTopUpModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold shrink-0 hover:bg-emerald-500/25 active:scale-95 transition-all"
          title="Nạp tiền vào ví"
        >
          <Wallet className="w-3 h-3 text-emerald-400" />
          <span className="font-mono">
            {userBalance >= 1000 ? `${Math.round(userBalance / 1000)}k` : `${userBalance}đ`}
          </span>
        </button>

        {/* Theme Picker Button */}
        <button
          onClick={() => setIsThemeModalOpen(true)}
          className="p-1.5 rounded-full bg-white/10 hover:bg-white/15 text-white/80 hover:text-white shrink-0 active:scale-95 transition-transform"
          title="Đổi chủ đề giao diện"
        >
          <Palette className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
