import React from 'react';
import {
  ListMusic,
  ShoppingBag,
  ShieldCheck,
  TrendingUp,
  Radio,
  FolderHeart,
  PlusCircle,
  Disc,
} from 'lucide-react';
import { useMusic } from '../../context/MusicContext';
import { ActiveDesktopTab } from '../../types/music';

export const DesktopSidebar: React.FC = () => {
  const { activeDesktopTab, setActiveDesktopTab } = useMusic();

  const mainNavItems: { id: ActiveDesktopTab; label: string; icon: React.ReactNode; isLive?: boolean }[] = [
    { id: 'discover', label: 'Danh Sách Bài Hát', icon: <ListMusic className="w-5 h-5" /> },
    { id: 'store', label: 'Cửa Hàng Nhạc', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 'admin', label: 'Admin Quản Trị', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'chart', label: '#xuankenchart', icon: <TrendingUp className="w-5 h-5" /> },
    { id: 'radio', label: 'Radio Trực Tuyến', icon: <Radio className="w-5 h-5" />, isLive: true },
    { id: 'library', label: 'Thư Viện Của Tôi', icon: <FolderHeart className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 h-full shrink-0 flex flex-col justify-between border-r border-white/5 bg-[#170f23] text-white select-none z-20">
      <div className="flex flex-col">
        {/* Brand Logo: XuanKen Music */}
        <div
          onClick={() => setActiveDesktopTab('discover')}
          className="px-6 py-5 flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#9b4de0] via-[#c273ed] to-[#7200a7] flex items-center justify-center shadow-lg shadow-[#9b4de0]/30 group-hover:scale-105 transition-transform">
            <Disc className="w-6 h-6 text-white animate-spin-slow" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white uppercase leading-none font-['Roboto_Condensed']">
              XuanKen <span className="text-[#c273ed]">Music</span>
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
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-[#9b4de0] text-white shadow-lg shadow-[#9b4de0]/20'
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
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Area: Create Playlist button without VIP */}
      <div className="p-4 space-y-2 border-t border-white/5">
        <button
          onClick={() => setActiveDesktopTab('library')}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-xs font-bold text-white transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-[#c273ed]" />
          <span>Tạo playlist mới</span>
        </button>
      </div>
    </aside>
  );
};
