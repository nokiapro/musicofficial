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
import { DesktopWeeklyTopPage } from './DesktopWeeklyTopPage';
import { DesktopProfileModal } from './DesktopProfileModal';
import { CuratedAlbumsView } from '../albums/CuratedAlbumsView';
import { ChatBoxView } from '../chat/ChatBoxView';

export const DesktopAppLayout: React.FC = () => {
  const { activeDesktopTab, isProfileModalOpen, setIsProfileModalOpen } = useMusic();

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

      case 'weeklyTop':
        return <DesktopWeeklyTopPage />;

      case 'library':
        return <DesktopLibraryPage />;

      case 'albums':
        return <CuratedAlbumsView />;

      case 'chat':
        return <ChatBoxView />;

      case 'radio':
        return <CuratedAlbumsView />;

      default:
        return <DesktopSongListView />;
    }
  };

  return (
    <div
      className="flex h-screen w-screen overflow-hidden text-white flex-col select-none transition-colors duration-200 font-['Roboto_Condensed']"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Top Body Row (Sidebar + Main Content + Right Queue Drawer) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <DesktopSidebar />

        {/* Center Main Work Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <DesktopHeader />
          <main className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
            <div className="w-full max-w-[1580px] mx-auto">{renderContent()}</div>
          </main>
        </div>

        {/* Right Queue Drawer */}
        <DesktopQueueDrawer />
      </div>

      {/* Fixed Bottom Player Bar */}
      <DesktopPlayerBar />

      {/* Desktop Profile Modal */}
      <DesktopProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};
