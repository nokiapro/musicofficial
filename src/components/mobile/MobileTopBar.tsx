import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Settings, Palette, Waves, Clock } from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ThemeId } from '../../types/music';

export const MobileTopBar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    setActiveMobileTab,
    theme,
    setTheme,
    setIsThemeModalOpen,
    sleepTimerMinutes,
    sleepTimerRemainingSeconds,
    setSleepTimer,
    crossfadeDuration,
    setCrossfadeDuration,
    currentUser,
  } = useMusic();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSettingsOpen]);

  const themeList: { id: ThemeId; name: string; color: string }[] = [
    { id: 'purple', name: 'Tím Zing', color: 'bg-[#9b4de0]' },
    { id: 'blue', name: 'Xanh Biển', color: 'bg-[#06b6d4]' },
    { id: 'sunset', name: 'Hoàng Hôn', color: 'bg-[#f43f5e]' },
    { id: 'emerald', name: 'Lá Quang', color: 'bg-[#10b981]' },
    { id: 'gold', name: 'Hoàng Gia', color: 'bg-[#eab308]' },
    { id: 'dark', name: 'AMOLED Đen', color: 'bg-[#475569]' },
    { id: 'rose', name: 'Hồng Ruby', color: 'bg-[#fb7185]' },
    { id: 'light', name: 'Bạch Kim', color: 'bg-[#8b5cf6]' },
  ];

  return (
    <div
      className="sticky top-0 z-30 backdrop-blur-md border-b text-white select-none transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-color)' }}
    >
      {/* Top Search & Actions Row */}
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2.5">
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

        {/* Setting Button & Popover (Contains Theme, Crossfade, Sleep Timer like PC) */}
        <div className="relative shrink-0" ref={settingsRef}>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            style={isSettingsOpen ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isSettingsOpen
                ? 'text-white shadow-lg'
                : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
            }`}
            title="Cài đặt hệ thống (Giao diện, Hẹn giờ, Crossfade)"
          >
            <Settings
              className={`w-4 h-4 transition-transform duration-300 ${
                isSettingsOpen ? 'rotate-90' : ''
              }`}
            />
            {sleepTimerRemainingSeconds !== null && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full border border-black shadow" />
            )}
          </button>

          {/* Settings Dropdown Popover */}
          {isSettingsOpen && (
            <div
              className="absolute right-0 top-10 w-72 border rounded-2xl shadow-2xl p-4 z-50 text-white space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-200"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#9b4de0]/20 text-[#c273ed] flex items-center justify-center">
                    <Settings className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold">Cài Đặt Hệ Thống</h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 1. Giao diện & Chủ đề (Theme) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#c273ed]" />
                    <span>Chủ đề giao diện</span>
                  </span>
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsThemeModalOpen(true);
                    }}
                    className="text-[10px] text-[#c273ed] hover:underline"
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {themeList.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`flex flex-col items-center gap-1 p-1 rounded-xl border text-[9px] font-semibold transition-all ${
                        theme === t.id
                          ? 'border-[#9b4de0] bg-[#9b4de0]/20 text-white shadow'
                          : 'border-white/5 bg-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 rounded-full ${t.color}`} />
                      <span className="truncate w-full text-center">{t.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Crossfade hòa trộn âm thanh */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Nối nhạc Crossfade</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400">
                    {crossfadeDuration === 0 ? 'Tắt' : `${crossfadeDuration}s`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 2, 3, 5].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => setCrossfadeDuration(sec)}
                      className={`py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        crossfadeDuration === sec
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-white/5 border-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      {sec === 0 ? 'Tắt' : `${sec}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Hẹn giờ tắt nhạc */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between text-xs font-semibold text-white/70">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hẹn giờ tắt</span>
                  </span>
                  {sleepTimerRemainingSeconds !== null && (
                    <span className="text-[10px] font-mono font-bold text-amber-400">
                      {Math.floor(sleepTimerRemainingSeconds / 60)}:{(sleepTimerRemainingSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { min: null, label: 'Tắt' },
                    { min: 15, label: '15p' },
                    { min: 30, label: '30p' },
                    { min: 45, label: '45p' },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSleepTimer(item.min)}
                      className={`py-1 rounded-lg text-[10px] font-bold border transition-all ${
                        sleepTimerMinutes === item.min
                          ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                          : 'bg-white/5 border-white/5 text-white/60 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
