import React from 'react';
import { MusicProvider, useMusic } from './context/MusicContext';
import { DesktopAppLayout } from './components/desktop/DesktopAppLayout';
import { MobileAppLayout } from './components/mobile/MobileAppLayout';

const MainApp: React.FC = () => {
  const { effectiveIsMobile } = useMusic();
  return effectiveIsMobile ? <MobileAppLayout /> : <DesktopAppLayout />;
};

export default function App() {
  return (
    <MusicProvider>
      <MainApp />
    </MusicProvider>
  );
}
