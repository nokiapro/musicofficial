import React from 'react';
import { useMusic } from '../../context/MusicContext';
import { DesktopSidebar } from './DesktopSidebar';
import { DesktopHeader } from './DesktopHeader';
import { DesktopPlayerBar } from './DesktopPlayerBar';
import { DesktopQueueDrawer } from './DesktopQueueDrawer';
import { DesktopSongListView } from './DesktopSongListView';
import { DesktopChartPage } from './DesktopChartPage';
import { DesktopLibraryPage } from './DesktopLibraryPage';
import { StorePageView } from '../store/StorePageView';
import { AdminPageView } from '../admin/AdminPageView';
import { KaraokeLyricsModal } from '../lyrics/KaraokeLyricsModal';
import { LrcViewerModal } from '../lyrics/LrcViewerModal';
import { DemoLimitModal } from '../store/DemoLimitModal';
import { BuySongModal } from '../store/BuySongModal';
import { TopUpModal } from '../store/TopUpModal';
import { LoginModal } from '../auth/LoginModal';
import { ThemeSelectorModal } from '../common/ThemeSelectorModal';
import { SleepTimerModal } from '../common/SleepTimerModal';
import { Radio } from 'lucide-react';

export const DesktopAppLayout: React.FC = () => {
  const { activeDesktopTab, playSong, songs } = useMusic();

  const radioStations = [
    {
      id: 'rad-1',
      title: 'Xone Radio',
      genre: 'Top Hits V-Pop & US-UK',
      listeners: '14.2K người đang nghe',
      gradient: 'from-purple-600 to-indigo-800',
    },
    {
      id: 'rad-2',
      title: 'Chạm & Yêu (Acoustic)',
      genre: 'Giai điệu chữa lành đêm muộn',
      listeners: '8.7K người đang nghe',
      gradient: 'from-pink-600 to-rose-700',
    },
    {
      id: 'rad-3',
      title: 'Zing EDM Nonstop',
      genre: 'Vinahouse & Bass House 2026',
      listeners: '21.5K người đang nghe',
      gradient: 'from-amber-500 to-red-600',
    },
    {
      id: 'rad-4',
      title: 'Nhạc Trẻ Gây Nghiện',
      genre: 'V-Pop TikTok Trending',
      listeners: '32.1K người đang nghe',
      gradient: 'from-cyan-600 to-blue-800',
    },
  ];

  const renderContent = () => {
    switch (activeDesktopTab) {
      case 'discover':
        // Requirement 2: The table with STT - TÊN BÀI - TÊN CA SỸ - LRC - THỜI LƯỢNG - MP3 HAY WAV
        return <DesktopSongListView />;

      case 'store':
        // Requirement 4: Cửa hàng mua nhạc (Demo 60s vs Full)
        return <StorePageView />;

      case 'admin':
        // Requirement 5: Trang Admin quản lý website, thêm sửa xóa bài hát
        return <AdminPageView />;

      case 'chart':
        return <DesktopChartPage />;

      case 'library':
        return <DesktopLibraryPage />;

      case 'radio':
        return (
          <div className="space-y-6 pb-16">
            <h1 className="text-3xl font-bold text-white tracking-tight">Radio Trực Tuyến</h1>
            <p className="text-sm text-white/60">
              Lắng nghe các luồng âm nhạc được phát trực tiếp 24/7 cùng hàng nghìn thính giả
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {radioStations.map((r, i) => (
                <div
                  key={r.id}
                  onClick={() => {
                    if (songs.length > 0) {
                      playSong(songs[i % songs.length]);
                    }
                  }}
                  className={`p-5 rounded-2xl bg-gradient-to-br ${r.gradient} shadow-xl cursor-pointer text-white flex flex-col justify-between h-48 hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 uppercase tracking-wider">
                      LIVE
                    </span>
                    <Radio className="w-5 h-5 text-white animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-lg font-bold">{r.title}</h3>
                    <p className="text-xs text-white/80 mt-0.5">{r.genre}</p>
                    <p className="text-[11px] text-white/60 mt-2 font-medium">{r.listeners}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <DesktopSongListView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#120822] text-white flex-col select-none">
      {/* Top Body Row (Sidebar + Main Content + Right Queue Drawer) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <DesktopSidebar />

        {/* Center Main Work Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DesktopHeader />
          <main className="flex-1 overflow-y-auto px-8 py-6">
            <div className="max-w-7xl mx-auto">{renderContent()}</div>
          </main>
        </div>

        {/* Right Queue Drawer */}
        <DesktopQueueDrawer />
      </div>

      {/* Fixed Bottom Player Bar */}
      <DesktopPlayerBar />

      {/* Global Modals */}
      <KaraokeLyricsModal />
      <LrcViewerModal />
      <DemoLimitModal />
      <BuySongModal />
      <TopUpModal />
      <LoginModal />
      <ThemeSelectorModal />
      <SleepTimerModal />
    </div>
  );
};
