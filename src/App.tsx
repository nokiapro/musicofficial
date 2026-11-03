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
import { KaraokeLyricsModal } from './components/lyrics/KaraokeLyricsModal';
import { LrcViewerModal } from './components/lyrics/LrcViewerModal';
import { TopUpModal } from './components/store/TopUpModal';
import { DemoLimitModal } from './components/store/DemoLimitModal';

function MainMusicApp() {
  const { effectiveIsMobile, theme } = useMusic();

  return (
    <div
      data-theme={theme}
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
      className="min-h-screen select-none transition-colors duration-200 font-['Roboto_Condensed']"
    >
      <InteractionSplash />
      {effectiveIsMobile ? <MobileAppLayout /> : <DesktopAppLayout />}
      <LoginModal />
      <ThemeSelectorModal />
      <SleepTimerModal />
      <AudioSettingsModal />
      <DownloadModal />
      <PlaylistModal />
      <ShareModal />
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
