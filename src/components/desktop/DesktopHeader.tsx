import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Play,
  Heart,
  Settings,
  Palette,
  Clock,
  Waves,
  Check,
  BellOff,
  Sparkles,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ThemeId } from '../../types/music';

export const DesktopHeader: React.FC = () => {
  const {
    songs,
    searchQuery,
    setSearchQuery,
    theme,
    setTheme,
    setIsThemeModalOpen,
    sleepTimerMinutes,
    sleepTimerRemainingSeconds,
    setSleepTimer,
    crossfadeDuration,
    setCrossfadeDuration,
    playSong,
    likedSongIds,
    toggleLike,
    currentUser,
    logout,
    setIsLoginModalOpen,
  } = useMusic();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customTimerInput, setCustomTimerInput] = useState('20');
  const settingsRef = useRef<HTMLDivElement | null>(null);

  // Close settings dropdown when clicking outside
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

  const searchResults = searchQuery.trim()
    ? songs.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.artists.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.album ? s.album.toLowerCase().includes(searchQuery.toLowerCase()) : false)
      )
    : [];

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

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <header
      className="h-16 px-8 flex items-center justify-between gap-6 border-b backdrop-blur-md sticky top-0 z-30 select-none transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-header)', borderColor: 'var(--border-color)' }}
    >
      {/* Left: Clean Search Bar directly (Arrows removed) */}
      <div className="relative flex-1 max-w-xl">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/10 border border-white/10 focus-within:border-[#9b4de0] focus-within:bg-[#231b2e] transition-all">
          <Search className="w-4 h-4 text-white/50 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
            placeholder="Tìm kiếm bài hát, ca sỹ, file LRC..."
            className="w-full bg-transparent text-sm text-white placeholder-white/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-white/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Dropdown Results */}
        {isSearchFocused && searchQuery.trim() && (
          <div className="absolute top-12 left-0 right-0 max-h-96 overflow-y-auto bg-[#231b2e] border border-white/15 rounded-2xl shadow-2xl p-3 z-50">
            <p className="text-xs font-semibold text-white/50 px-2 py-1 uppercase tracking-wider">
              Kết quả tìm kiếm ({searchResults.length})
            </p>
            {searchResults.length === 0 ? (
              <div className="p-4 text-center text-sm text-white/60">
                Không tìm thấy bài hát hoặc nghệ sĩ phù hợp
              </div>
            ) : (
              <div className="space-y-1 mt-1">
                {searchResults.map((song) => {
                  const isLiked = likedSongIds.includes(song.id);
                  return (
                    <div
                      key={song.id}
                      onClick={() => {
                        playSong(song);
                        setIsSearchFocused(false);
                      }}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/10 cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${song.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center shrink-0 relative`}
                        >
                          <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-semibold text-white truncate">{song.title}</p>
                          <p className="text-xs text-white/60 truncate">{song.artists}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            song.audioFormat === 'WAV'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {song.audioFormat}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(song.id);
                          }}
                          className="p-1.5 text-white/40 hover:text-red-400"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              isLiked ? 'text-red-500 fill-red-500' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Login/Profile & Setting Gear Icon on the far right */}
      <div className="flex items-center gap-3">
        {/* User Account / Login Button */}
        {currentUser ? (
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-white max-w-[130px] truncate leading-tight">
                {currentUser.displayName || currentUser.email}
              </span>
              <span className="text-[10px] text-[#c273ed] uppercase font-black">
                {currentUser.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-500/20 text-white hover:text-red-300 flex items-center justify-center text-xs font-bold transition-colors"
              title="Đăng xuất"
            >
              XK
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            style={{ backgroundColor: 'var(--color-accent)' }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-transform active:scale-95 hover:opacity-90"
          >
            <span>Đăng Nhập</span>
          </button>
        )}

        {/* Setting Button & Popover at the far right after Login */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            style={isSettingsOpen ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
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
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-black shadow" />
            )}
          </button>

          {/* Settings Dropdown Popover */}
          {isSettingsOpen && (
            <div
              className="absolute right-0 top-12 w-80 border rounded-3xl shadow-2xl p-5 z-50 text-white space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#9b4de0]/20 text-[#c273ed] flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold">Cài Đặt Hệ Thống</h3>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. Giao diện & Chủ đề (Theme) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-purple-400" />
                    <span>Chủ đề giao diện</span>
                  </label>
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsThemeModalOpen(true);
                    }}
                    className="text-[10px] text-[#c273ed] hover:underline font-bold"
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {themeList.map((t) => {
                    const isSelected = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`p-1.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                          isSelected
                            ? 'border-[#9b4de0] bg-[#9b4de0]/25 shadow-sm'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                        title={t.name}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${t.color} shadow-sm`} />
                        <span className="text-[9px] font-bold truncate max-w-full text-white/80">
                          {t.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Hẹn giờ tắt nhạc (Sleep Timer) */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Hẹn giờ tắt nhạc</span>
                  </label>
                  {sleepTimerRemainingSeconds !== null && (
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {formatRemaining(sleepTimerRemainingSeconds)}
                    </span>
                  )}
                </div>

                {sleepTimerRemainingSeconds !== null ? (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-purple-500/15 border border-purple-500/30">
                    <span className="text-xs text-purple-200">Đang đếm ngược tắt</span>
                    <button
                      onClick={() => setSleepTimer(null)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 text-[10px] font-bold hover:bg-red-500/30 transition-colors"
                    >
                      <BellOff className="w-3 h-3" />
                      <span>Hủy</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-1.5">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        onClick={() => setSleepTimer(mins)}
                        className="py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-white/80 transition-colors"
                      >
                        {mins}p
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Nối nhạc mượt mà (Crossfade - Requirement 5) */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                    <Waves className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Crossfade (Nối nhạc mượt)</span>
                  </label>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                    {crossfadeDuration === 0 ? 'Tắt' : `${crossfadeDuration}s`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { sec: 0, label: 'Tắt' },
                    { sec: 2, label: '2s' },
                    { sec: 3, label: '3s' },
                    { sec: 5, label: '5s' },
                  ].map((opt) => {
                    const isSelected = crossfadeDuration === opt.sec;
                    return (
                      <button
                        key={opt.sec}
                        onClick={() => setCrossfadeDuration(opt.sec)}
                        className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-white/70'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
