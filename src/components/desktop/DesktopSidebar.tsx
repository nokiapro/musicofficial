import React from 'react';
import {
  ListMusic,
  ShoppingBag,
  ShieldCheck,
  TrendingUp,
  Disc3,
  MessageSquare,
  FolderHeart,
  Disc,
  Flame,
  User,
  Mic2,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ActiveDesktopTab } from '../../types/music';

export const DesktopSidebar: React.FC = () => {
  const {
    activeDesktopTab,
    setActiveDesktopTab,
    currentUser,
    isAdmin,
    setIsProfileModalOpen,
    setSelectedAlbum,
    setSelectedPlaylist,
    setSelectedArtistName,
    siteSettings,
  } = useMusic();

  const brandName = (siteSettings?.siteName || '').trim();
  const brandWords = brandName.split(/\s+/).filter(Boolean);
  const brandLead = brandWords.length > 1 ? brandWords.slice(0, -1).join(' ') : brandName;
  const brandTail = brandWords.length > 1 ? brandWords[brandWords.length - 1] : '';
  const brandSlogan = (siteSettings?.siteSlogan || '').trim();

  // Safety redirect: If a non-admin is on admin tab, or guest is on chat/library tab, redirect to discover
  React.useEffect(() => {
    if (!isAdmin && activeDesktopTab === 'admin') {
      setActiveDesktopTab('discover');
    }
    if (!currentUser && (activeDesktopTab === 'chat' || activeDesktopTab === 'library')) {
      setActiveDesktopTab('discover');
    }
  }, [isAdmin, currentUser, activeDesktopTab, setActiveDesktopTab]);

  // Navigation Items
  const mainNavItems: { id: ActiveDesktopTab; label: string; icon: React.ReactNode; isLive?: boolean; isHot?: boolean }[] = [
    { id: 'discover', label: 'Danh Sách Bài Hát', icon: <ListMusic className="w-5 h-5" /> },
    { id: 'chart', label: '#xuankenchart', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'weeklyTop', label: 'Top Tuần', icon: <Flame className="w-5 h-5 text-amber-400" />, isHot: true },
    { id: 'albums', label: 'Album Nhạc Hay', icon: <Disc3 className="w-5 h-5 text-purple-400" /> },
    { id: 'artists', label: 'Tiểu Sử Ca Sĩ', icon: <Mic2 className="w-5 h-5 text-pink-400" /> },
    ...(currentUser ? [{ id: 'chat' as ActiveDesktopTab, label: 'Chat Box', icon: <MessageSquare className="w-5 h-5 text-sky-400" />, isLive: true }] : []),
    { id: 'store', label: 'Cửa Hàng Nhạc', icon: <ShoppingBag className="w-5 h-5" /> },
    ...(isAdmin ? [{ id: 'admin' as ActiveDesktopTab, label: 'Admin Quản Trị', icon: <ShieldCheck className="w-5 h-5 text-amber-400" /> }] : []),
    ...(currentUser ? [{ id: 'library' as ActiveDesktopTab, label: 'Thư Viện Của Tôi', icon: <FolderHeart className="w-5 h-5" /> }] : []),
  ];

  return (
    <>
      <aside
        className="w-64 h-full shrink-0 flex flex-col justify-between border-r text-white select-none z-20 transition-colors duration-200 relative"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-sidebar) 94%, transparent)',
          borderColor: 'rgba(255, 255, 255, 0.07)',
        }}
      >
        <div className="flex flex-col min-h-0 flex-1 overflow-y-auto">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveDesktopTab('discover')}
            className="px-5 pt-5 pb-4 flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center accent-glow-btn group-hover:scale-105 transition-transform shrink-0">
              <Disc className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div className="flex flex-col min-w-0 min-h-[34px] justify-center">
              {brandName && (
                <span className="text-[18px] font-extrabold tracking-tight text-white uppercase leading-tight font-display break-words">
                  {brandLead}
                  {brandTail ? (
                    <>
                      {' '}
                      <span style={{ color: 'var(--color-accent)' }}>{brandTail}</span>
                    </>
                  ) : null}
                </span>
              )}
              {brandSlogan && (
                <span
                  title={brandSlogan}
                  className="text-[10.5px] font-medium text-white/55 tracking-[0.03em] mt-1 leading-snug break-words"
                >
                  {brandSlogan}
                </span>
              )}
            </div>
          </div>

          <div className="mx-5 mb-3 h-px bg-white/[0.06]" />

          {/* Navigation items */}
          <nav className="px-3 space-y-1">
            {mainNavItems.map((item) => {
              const isActive = activeDesktopTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveDesktopTab(item.id);
                    if (item.id === 'albums') {
                      setSelectedAlbum(null);
                    }
                    if (item.id === 'library') {
                      setSelectedPlaylist(null);
                    }
                  }}
                  style={
                    isActive
                      ? {
                          background:
                            'linear-gradient(90deg, color-mix(in srgb, var(--color-accent) 90%, transparent), color-mix(in srgb, var(--color-accent) 68%, #ffffff 18%))',
                          boxShadow:
                            '0 8px 22px -6px color-mix(in srgb, var(--color-accent) 55%, transparent), inset 0 1px 0 rgba(255,255,255,0.2)',
                        }
                      : undefined
                  }
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'text-white'
                      : 'text-white/65 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`transition-transform duration-150 ${isActive ? 'text-white scale-105' : 'text-white/60'}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.isLive && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-rose-500/90 text-white tracking-wider shadow-sm">
                      LIVE
                    </span>
                  )}
                  {item.isHot && (
                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-rose-500 text-white tracking-wider shadow-sm">
                      TOP 10
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card: giữ nguyên badge ADMIN bên phải căn giữa với chỉnh sửa tài khoản */}
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/20 text-left transition-all group cursor-pointer"
            title="Quản lý thông tin cá nhân, đổi avatar và tên hiển thị"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* User Avatar */}
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/15 bg-zinc-900 shrink-0 flex items-center justify-center shadow-sm">
                {currentUser?.avatarUrl ? (
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
                    currentUser?.avatarUrl ? 'absolute inset-0 -z-10' : ''
                  }`}
                >
                  {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : <User className="w-5 h-5 text-white/80" />}
                </div>
              </div>

              {/* User Info / Personal Label */}
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <p className="text-[13px] font-bold text-white group-hover:text-white transition-colors truncate">
                  {currentUser ? (currentUser.displayName || 'Cá Nhân') : 'Cá Nhân'}
                </p>
                <p className="text-[11px] text-white/50 truncate">
                  {currentUser ? 'Chỉnh sửa tài khoản' : 'Đăng nhập / Hồ sơ'}
                </p>
              </div>
            </div>

            {currentUser && isAdmin && (
              <span className="shrink-0 ml-2 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-red-600/90 border border-red-400/30 text-white shadow-xs tracking-wider self-center">
                ADMIN
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
