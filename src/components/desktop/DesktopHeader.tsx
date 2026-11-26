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
  BellOff,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ThemeId } from '../../types/music';
import { formatArtistsString } from '../../utils/artistUtils';
import { useAnimatedPresence } from '../../hooks/useAnimatedPresence';

export const DesktopHeader: React.FC = () => {
  const {
    canGoBack,
    canGoForward,
    navigateBack,
    navigateForward,
    songs,
    searchQuery,
    setSearchQuery,
    theme,
    setTheme,
    setIsThemeModalOpen,
    sleepTimerRemainingSeconds,
    setSleepTimer,
    crossfadeDuration,
    setCrossfadeDuration,
    playSong,
    likedSongIds,
    toggleLike,
    currentUser,
    setIsLoginModalOpen,
    setIsProfileModalOpen,
    allSearchableSongs,
    exclusiveAlbums,
    playAlbumTrack,
  } = useMusic();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);
  const { shouldRender: shouldRenderSettings, isClosing: isClosingSettings } = useAnimatedPresence(
    isSettingsOpen,
    160
  );

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

  // Requirement 3: Bao gồm tất cả các bài hát đang có trong web luôn kể cả các bài hát trong album nhạc hay
  const searchResults = searchQuery.trim()
    ? (allSearchableSongs || songs).filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.artists.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.album ? s.album.toLowerCase().includes(searchQuery.toLowerCase()) : false)
      )
    : [];

  const themeList: { id: ThemeId; name: string; hex: string }[] = [
    { id: 'purple', name: 'Tím Zing', hex: '#9b4de0' },
    { id: 'blue', name: 'Xanh Biển', hex: '#06b6d4' },
    { id: 'sunset', name: 'Hoàng Hôn', hex: '#f43f5e' },
    { id: 'emerald', name: 'Lá Quang', hex: '#10b981' },
    { id: 'gold', name: 'Hoàng Gia', hex: '#eab308' },
    { id: 'dark', name: 'AMOLED Đen', hex: '#475569' },
    { id: 'rose', name: 'Hồng Ruby', hex: '#fb7185' },
    { id: 'light', name: 'Bạch Kim', hex: '#8b5cf6' },
  ];

  const formatRemaining = (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds));
    const hrs = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header
      className="h-16 px-8 grid grid-cols-[1fr_minmax(280px,580px)_1fr] items-center gap-4 border-b glass-bar sticky top-0 z-30 select-none transition-colors duration-200"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-header) 78%, transparent)',
        borderColor: 'rgba(255, 255, 255, 0.07)',
      }}
    >
      {/* Left: Folder / Page Navigation Arrows */}
      <div className="flex items-center gap-2">
        <button
          onClick={navigateBack}
          disabled={!canGoBack}
          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
            canGoBack
              ? 'bg-white/[0.06] hover:bg-white/[0.14] border-white/[0.1] text-white cursor-pointer active:scale-95 shadow-sm'
              : 'bg-white/[0.03] border-white/[0.04] text-white/25 cursor-not-allowed opacity-50'
          }`}
          title="Quay lại (Folder / Album / Trang trước)"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={navigateForward}
          disabled={!canGoForward}
          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
            canGoForward
              ? 'bg-white/[0.06] hover:bg-white/[0.14] border-white/[0.1] text-white cursor-pointer active:scale-95 shadow-sm'
              : 'bg-white/[0.03] border-white/[0.04] text-white/25 cursor-not-allowed opacity-50'
          }`}
          title="Tiến tới (Folder / Album / Trang sau)"
          aria-label="Tiến tới"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Clean Search Bar */}
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.09] hover:border-white/20 focus-within:border-[var(--color-accent)] focus-within:bg-black/40 focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--color-accent)_22%,transparent)] transition-all">
          <Search className="w-4 h-4 text-white/50 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 250)}
            placeholder="Tìm kiếm bài hát, ca sỹ, file LRC..."
            className="w-full bg-transparent text-[13.5px] text-white placeholder-white/40 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-white/40 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Dropdown Results */}
        {isSearchFocused && searchQuery.trim() && (
          <div className="absolute top-12 left-0 right-0 max-h-96 overflow-y-auto glass-panel rounded-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
            <p className="text-[11px] font-bold text-[var(--text-secondary)] px-2.5 py-1 uppercase tracking-wider">
              Kết quả tìm kiếm ({searchResults.length})
            </p>
            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-sm text-[var(--text-secondary)]">
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
                        if (song.isAlbumTrack) {
                          const foundAlbum = exclusiveAlbums.find((a) => a.id === song.albumId || a.title === song.album);
                          if (foundAlbum) {
                            playAlbumTrack(song as any, foundAlbum);
                          } else {
                            playSong(song);
                          }
                        } else {
                          playSong(song);
                        }
                        setIsSearchFocused(false);
                      }}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.08] cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative border border-white/10 bg-zinc-950/90 shadow-md flex items-center justify-center">
                          {song.coverImage ? (
                            <img
                              src={song.coverImage}
                              alt={song.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full bg-gradient-to-tr ${song.coverGradient || 'from-purple-600 to-indigo-800'} flex items-center justify-center ${song.coverImage ? 'absolute inset-0 -z-10' : ''}`}
                          >
                            <Play className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-current" />
                          </div>
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-semibold text-white truncate group-hover:text-[var(--color-accent)] transition-colors">{song.title}</p>
                          <p className="text-xs text-white/55 truncate">
                            {formatArtistsString(song.artists)} {song.isAlbumTrack ? `• Album: ${song.album}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                            song.audioFormat === 'WAV'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20'
                              : 'bg-sky-500/15 text-sky-300 border border-sky-500/20'
                          }`}
                        >
                          {song.audioFormat}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(song.id);
                          }}
                          className="p-1.5 text-white/40 hover:text-red-400 transition-colors"
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
      <div className="flex items-center justify-end gap-3">
        {/* User Account / Login Button */}
        {currentUser ? (
          <div className="flex items-center gap-2.5">
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex flex-col text-right cursor-pointer group"
              title="Chỉnh sửa tài khoản"
            >
              <span className="text-xs font-bold text-white max-w-[130px] truncate leading-tight group-hover:text-[var(--color-accent)] transition-colors">
                {currentUser.displayName || currentUser.email}
              </span>
              <span className="text-[10px] uppercase font-extrabold tracking-wider" style={{ color: 'var(--color-accent)' }}>
                {currentUser.role}
              </span>
            </div>

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="relative w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-zinc-900 shrink-0 flex items-center justify-center shadow-md cursor-pointer hover:ring-2 hover:ring-[var(--color-accent)] transition-all"
              title={`${currentUser.displayName || 'Tài khoản'} - Bấm để chỉnh sửa tài khoản & avatar`}
            >
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.displayName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-xs ${
                  currentUser.avatarUrl ? 'absolute inset-0 -z-10' : ''
                }`}
              >
                {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'XK'}
              </div>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold accent-glow-btn transition-transform active:scale-95 cursor-pointer"
          >
            <span>Đăng Nhập</span>
          </button>
        )}

        {/* Setting Button & Popover at the far right after Login */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            style={isSettingsOpen ? { backgroundColor: 'var(--color-accent)' } : undefined}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
              isSettingsOpen
                ? 'text-white border-white/20 shadow-lg'
                : 'bg-white/[0.06] hover:bg-white/[0.14] border-white/[0.09] text-white/80 hover:text-white'
            }`}
            title="Cài đặt hệ thống (Giao diện, Hẹn giờ, Crossfade)"
          >
            <Settings
              className={`w-4 h-4 transition-transform duration-300 ${
                isSettingsOpen ? 'rotate-90' : ''
              }`}
            />
            {sleepTimerRemainingSeconds !== null && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black shadow" />
            )}
          </button>

          {/* Settings Dropdown Popover */}
          {shouldRenderSettings && (
            <div
              className={`absolute right-0 top-12 w-80 glass-panel rounded-3xl p-5 z-50 text-white space-y-4 origin-top-right ${
                isClosingSettings ? 'animate-out slide-out-to-top-2 duration-150' : 'animate-in slide-in-from-top-2 duration-200'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-accent) 22%, transparent)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold font-display">Cài Đặt Hệ Thống</h3>
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
                        style={
                          isSelected
                            ? { borderColor: t.hex, backgroundColor: `${t.hex}33` }
                            : undefined
                        }
                        className={`p-1.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'shadow-sm'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                        title={t.name}
                      >
                        <span
                          style={{ backgroundColor: t.hex }}
                          className="w-3.5 h-3.5 rounded-full shadow-sm"
                        />
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
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30">
                    <div>
                      <p className="text-[10px] text-purple-200 font-bold uppercase tracking-wider">Đang đếm ngược tắt</p>
                      <p className="text-sm font-mono font-bold text-amber-300 tabular-nums">
                        {formatRemaining(sleepTimerRemainingSeconds)}
                      </p>
                    </div>
                    <button
                      onClick={() => setSleepTimer(null)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 text-xs font-bold hover:bg-red-500/30 transition-colors"
                    >
                      <BellOff className="w-3.5 h-3.5" />
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
