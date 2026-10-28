import React from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { DesktopAppLayout } from './components/desktop/DesktopAppLayout';
import { MobileAppLayout } from './components/mobile/MobileAppLayout';
import { InteractionSplash } from './components/common/InteractionSplash';
import { KaraokeLyricsModal } from './components/lyrics/KaraokeLyricsModal';
import { LrcViewerModal } from './components/lyrics/LrcViewerModal';
import { DemoLimitModal } from './components/store/DemoLimitModal';
import { BuySongModal } from './components/store/BuySongModal';
import { TopUpModal } from './components/store/TopUpModal';
import { LoginModal } from './components/auth/LoginModal';
import { ThemeSelectorModal } from './components/common/ThemeSelectorModal';
import { SleepTimerModal } from './components/common/SleepTimerModal';
import { AudioSettingsModal } from './components/common/AudioSettingsModal';
import { PlaylistModal } from './components/common/PlaylistModal';
import { ShareModal } from './components/common/ShareModal';
import { XuanKenRewindModal } from './components/common/XuanKenRewindModal';

const MainApp: React.FC = () => {
  const { effectiveIsMobile } = useMusic();
  return (
    <>
      <InteractionSplash />
      {effectiveIsMobile ? <MobileAppLayout /> : <DesktopAppLayout />}
      {/* Global Modals for both PC and Mobile - fully accessible anywhere */}
      <KaraokeLyricsModal />
      <LrcViewerModal />
      <DemoLimitModal />
      <BuySongModal />
      <TopUpModal />
      <LoginModal />
      <ThemeSelectorModal />
      <SleepTimerModal />
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
      <MainApp />
    </MusicProvider>
  );
}
