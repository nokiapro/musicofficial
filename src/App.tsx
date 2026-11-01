/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { DesktopAppLayout } from './components/desktop/DesktopAppLayout';
import { MobileAppLayout } from './components/mobile/MobileAppLayout';
import { InteractionSplash } from './components/common/InteractionSplash';
import { LoginModal } from './components/auth/LoginModal';
import { ThemeSelectorModal } from './components/common/ThemeSelectorModal';
import { SleepTimerModal } from './components/common/SleepTimerModal';
import { AudioSettingsModal } from './components/common/AudioSettingsModal';
import { DownloadModal } from './components/common/DownloadModal';
import { PlaylistModal } from './components/common/PlaylistModal';
import { ShareModal } from './components/common/ShareModal';
import { XuanKenRewindModal } from './components/common/XuanKenRewindModal';
import { KaraokeLyricsModal } from './components/lyrics/KaraokeLyricsModal';
import { LrcViewerModal } from './components/lyrics/LrcViewerModal';
import { TopUpModal } from './components/store/TopUpModal';
import { DemoLimitModal } from './components/store/DemoLimitModal';

function MainMusicApp() {
  const { effectiveIsMobile } = useMusic();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-white select-none transition-colors duration-200 font-['Roboto_Condensed']">
      {/* Interaction Splash Entry */}
      <InteractionSplash />

      {/* Responsive View: Desktop vs Mobile App Layout */}
      {effectiveIsMobile ? <MobileAppLayout /> : <DesktopAppLayout />}

      {/* Global Application Modals */}
      <LoginModal />
      <ThemeSelectorModal />
      <SleepTimerModal />
      <AudioSettingsModal />
      <DownloadModal />
      <PlaylistModal />
      <ShareModal />
      <XuanKenRewindModal />
      <KaraokeLyricsModal />
      <LrcViewerModal />
      <TopUpModal />
      <DemoLimitModal />
    </div>
  );
}

export default function App() {
  return (
    <MusicProvider>
      <MainMusicApp />
    </MusicProvider>
  );
}
