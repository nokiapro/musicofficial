import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Palette,
  Clock,
  Smartphone,
  Monitor,
  X,
  Play,
  Heart,
  Wallet,
  PlusCircle,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';

export const DesktopHeader: React.FC = () => {
  const {
    songs,
    searchQuery,
    setSearchQuery,
    setIsThemeModalOpen,
    setIsSleepTimerModalOpen,
    sleepTimerRemainingSeconds,
    viewMode,
    setViewMode,
    playSong,
    likedSongIds,
    toggleLike,
    userBalance,
    setIsTopUpModalOpen,
    currentUser,
    logout,
    setIsLoginModalOpen,
  } = useMusic();

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const searchResults = searchQuery.trim()
    ? songs.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.artists.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.album ? s.album.toLowerCase().includes(searchQuery.toLowerCase()) : false)
      )
    : [];

  return (
    <header className="h-16 px-8 flex items-center justify-between gap-6 border-b border-white/5 bg-[#120822]/90 backdrop-blur-md sticky top-0 z-30 select-none">
      {/* Left: History buttons + Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="flex items-center gap-2">
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            disabled
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
            disabled
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative flex-1">
          <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/10 border border-white/10 focus-within:border-[#9b4de0] focus-within:bg-[#231b2e] transition-all">
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
                            className={`w-10 h-10 rounded-lg bg-gradient-to-tr ${song.coverGradient} flex items-center justify-center shrink-0 relative`}
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
      </div>

      {/* Right: Wallet Balance, Device Mode Switcher, Theme, Sleep Timer */}
      <div className="flex items-center gap-3">
        {/* User Balance Wallet Button */}
        <button
          onClick={() => setIsTopUpModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-300 transition-colors"
          title="Bấm để nạp thêm tiền vào ví"
        >
          <Wallet className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-black font-mono">
            {userBalance.toLocaleString('vi-VN')} đ
          </span>
          <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
        </button>

        {/* Device Switcher (PC Web vs Mobile App preview) */}
        <div className="hidden sm:flex items-center p-1 bg-white/10 rounded-xl border border-white/10 text-xs font-medium">
          <button
            onClick={() => setViewMode('pc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'pc'
                ? 'bg-[#9b4de0] text-white shadow-sm font-semibold'
                : 'text-white/70 hover:text-white'
            }`}
            title="Xem giao diện Web PC"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Web PC</span>
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'mobile'
                ? 'bg-[#9b4de0] text-white shadow-sm font-semibold'
                : 'text-white/70 hover:text-white'
            }`}
            title="Xem giao diện Mobile App"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App Mobile</span>
          </button>
        </div>

        {/* Theme Picker */}
        <button
          onClick={() => setIsThemeModalOpen(true)}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition-colors"
          title="Chọn chủ đề giao diện"
        >
          <Palette className="w-4 h-4" />
        </button>

        {/* Sleep Timer */}
        <button
          onClick={() => setIsSleepTimerModalOpen(true)}
          className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            sleepTimerRemainingSeconds !== null
              ? 'bg-[#9b4de0] text-white shadow-md'
              : 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
          }`}
          title="Hẹn giờ tắt nhạc"
        >
          <Clock className="w-4 h-4" />
          {sleepTimerRemainingSeconds !== null && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border border-black" />
          )}
        </button>

        {/* User Account / Login Button */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-1 border-l border-white/10">
            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-white max-w-[110px] truncate leading-tight">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#9b4de0] hover:bg-[#8539c9] text-white text-xs font-bold shadow transition-transform active:scale-95"
          >
            <span>Đăng Nhập</span>
          </button>
        )}
      </div>
    </header>
  );
};
