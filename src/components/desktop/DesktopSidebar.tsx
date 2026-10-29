import React, { useState } from 'react';
import {
  ListMusic,
  ShoppingBag,
  ShieldCheck,
  TrendingUp,
  Radio,
  FolderHeart,
  Disc,
  Flame,
  User,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ActiveDesktopTab } from '../../types/music';

export const DesktopSidebar: React.FC = () => {
  const {
    activeDesktopTab,
    setActiveDesktopTab,
    currentUser,
    isAdmin,
    isProfileModalOpen,
    setIsProfileModalOpen,
  } = useMusic();

  // Item 2: Cho phần nghe nhiều nhất tuần xuống dưới xuankenchart và đổi tên là Top Tuần
  // Requirement 3: Tab Thư viện cá nhân chỉ khi đăng nhập tài khoản mới hiện
  const mainNavItems: { id: ActiveDesktopTab; label: string; icon: React.ReactNode; isLive?: boolean; isHot?: boolean }[] = [
    { id: 'discover', label: 'Danh Sách Bài Hát', icon: <ListMusic className="w-5 h-5" /> },
    { id: 'chart', label: '#xuankenchart', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'weeklyTop', label: 'Top Tuần', icon: <Flame className="w-5 h-5 text-amber-400" />, isHot: true },
    { id: 'store', label: 'Cửa Hàng Nhạc', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'admin', label: 'Admin Quản Trị', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'radio', label: 'Radio Trực Tuyến', icon: <Radio className="w-5 h-5" />, isLive: true },
    ...(currentUser ? [{ id: 'library' as ActiveDesktopTab, label: 'Thư Viện Của Tôi', icon: <FolderHeart className="w-5 h-5" /> }] : []),
  ];

  return (
    <>
      <aside
        className="w-64 h-full shrink-0 flex flex-col justify-between border-r text-white select-none z-20 transition-colors duration-200"
        style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-col">
          {/* Brand Logo */}
          <div
            onClick={() => setActiveDesktopTab('discover')}
            className="px-6 py-5 flex items-center gap-2.5 cursor-pointer group"
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              <Disc className="w-6 h-6 text-white animate-spin-slow" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-white uppercase leading-none font-['Roboto_Condensed']">
                XuanKen <span style={{ color: 'var(--color-accent)' }}>Music</span>
              </span>
              <span className="text-[10px] text-white/50 tracking-wider mt-0.5">
                NGHE & MUA NHẠC BẢN QUYỀN
              </span>
            </div>
          </div>

          {/* Navigation items */}
          <nav className="px-3 space-y-1.5 mt-2">
            {mainNavItems.map((item) => {
              const isActive = activeDesktopTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveDesktopTab(item.id)}
                  style={isActive ? { backgroundColor: 'var(--color-accent)' } : undefined}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-white/60'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.isLive && (
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-red-500 text-white tracking-wider">
                      LIVE
                    </span>
                  )}
                  {item.isHot && (
                    <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-rose-500 text-black tracking-wider">
                      TOP 10
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card: Ảnh 1 ở giao diện PC badge admin ở bên phải nhưng căn giữa chữ admin với chỉnh sửa tài khoản */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/40 text-left transition-all group"
            title="Quản lý thông tin cá nhân, đổi avatar và tên hiển thị"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* User Avatar */}
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/20 bg-zinc-900 shrink-0 flex items-center justify-center">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.displayName}
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
                <p className="text-xs font-bold text-white group-hover:text-[#c273ed] transition-colors truncate">
                  {currentUser ? (currentUser.displayName || 'Cá Nhân') : 'Cá Nhân'}
                </p>
                <p className="text-[10px] text-white/50 truncate">
                  {currentUser ? 'Chỉnh sửa tài khoản' : 'Đăng nhập / Hồ sơ'}
                </p>
              </div>
            </div>

            {/* Requirement 1: Badge ADMIN ở bên phải nhưng căn giữa chữ admin với chỉnh sửa tài khoản */}
            {currentUser && isAdmin && (
              <span className="shrink-0 ml-2 px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-400 text-black shadow-xs tracking-wider self-center">
                ADMIN
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
