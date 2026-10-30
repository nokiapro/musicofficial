import React from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { DesktopAppLayout } from './components/desktop/DesktopAppLayout';
import { MobileAppLayout } from './components/mobile/MobileAppLayout';
import { InteractionSplash } from './components/common/InteractionSplash';
import { KaraokeLyricsModal } from './components/lyrics/KaraokeLyricsModal';
import { LrcViewerModal } from './components/lyrics/LrcViewerModal';
import { ThemeSelectorModal } from './components/common/ThemeSelectorModal';
import { SleepTimerModal } from './components/common/SleepTimerModal';
import { DemoLimitModal } from './components/store/DemoLimitModal';
import { TopUpModal } from './components/store/TopUpModal';
import { LoginModal } from './components/auth/LoginModal';
import { DownloadModal } from './components/common/DownloadModal';
import { AudioSettingsModal } from './components/common/AudioSettingsModal';
import { PlaylistModal } from './components/common/PlaylistModal';
import { ShareModal } from './components/common/ShareModal';
import { XuanKenRewindModal } from './components/common/XuanKenRewindModal';

const AppContent: React.FC = () => {
  const { effectiveIsMobile } = useMusic();

  return (
    <>
      {/* Welcome Splash Screen */}
      <InteractionSplash />

      {/* Main Responsive Layout: Desktop vs Mobile */}
      {effectiveIsMobile ? <MobileAppLayout /> : <DesktopAppLayout />}

      {/* Global Floating Modals & Overlays */}
      <KaraokeLyricsModal />
      <LrcViewerModal />
      <ThemeSelectorModal />
      <SleepTimerModal />
      <DemoLimitModal />
      <TopUpModal />
      <LoginModal />
      <DownloadModal />
      <AudioSettingsModal />
      <PlaylistModal />
      <ShareModal />
      <XuanKenRewindModal />
    </>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <AppContent />
    </MusicProvider>
  );
}
