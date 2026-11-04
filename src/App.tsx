/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { DesktopAppLayout } from './components/desktop/DesktopAppLayout';
import { MobileAppLayout } from './components/mobile/MobileAppLayout';
import { InteractionSplash } from './components/common/InteractionSplash';
import { KaraokeLyricsModal } from './components/lyrics/KaraokeLyricsModal';
import { LrcViewerModal } from './components/lyrics/LrcViewerModal';
import { BuySongModal } from './components/store/BuySongModal';
import { DemoLimitModal } from './components/store/DemoLimitModal';
import { TopUpModal } from './components/store/TopUpModal';
import { PlaylistModal } from './components/common/PlaylistModal';
import { ShareModal } from './components/common/ShareModal';
import { DownloadModal } from './components/common/DownloadModal';
import { AudioSettingsModal } from './components/common/AudioSettingsModal';
import { SleepTimerModal } from './components/common/SleepTimerModal';
import { ThemeSelectorModal } from './components/common/ThemeSelectorModal';
import { LoginModal } from './components/auth/LoginModal';
import { XuanKenRewindModal } from './components/common/XuanKenRewindModal';

const MainAppContent: React.FC = () => {
  const { effectiveIsMobile, theme } = useMusic();

  return (
    <div
      data-theme={theme}
      className="min-h-screen w-full relative selection:bg-purple-500 selection:text-white"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Starting splash logo screen */}
      <InteractionSplash />

      {/* Responsive Main Layout */}
      {effectiveIsMobile ? <MobileAppLayout /> : <DesktopAppLayout />}

      {/* Global Modals */}
      <KaraokeLyricsModal />
      <LrcViewerModal />
      <BuySongModal />
      <DemoLimitModal />
      <TopUpModal />
      <PlaylistModal />
      <ShareModal />
      <DownloadModal />
      <AudioSettingsModal />
      <SleepTimerModal />
      <ThemeSelectorModal />
      <LoginModal />
      <XuanKenRewindModal />
    </div>
  );
};

export default function App() {
  return (
    <MusicProvider>
      <MainAppContent />
    </MusicProvider>
  );
}
