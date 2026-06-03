import { useEffect, useState } from 'react';
import { Home } from './screens/Home';
import { DailyScreen } from './screens/DailyScreen';
import { EndlessScreen } from './screens/EndlessScreen';
import { ClassicScreen } from './screens/ClassicScreen';
import { GalleryScreen } from './screens/GalleryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { boardSource } from './game/boardSource';
import { DIFFICULTIES } from './game/difficulties';

type Screen = 'home' | 'daily' | 'endless' | 'classic' | 'gallery' | 'settings';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');

  useEffect(() => {
    DIFFICULTIES.forEach((d) => boardSource.prewarm(d));
  }, []);

  const home = () => setScreen('home');

  return (
    <div className="relative h-full w-full overflow-hidden" style={{ minHeight: '100dvh' }}>
      {screen === 'home' && <Home go={setScreen} />}
      {screen === 'daily' && <DailyScreen onExit={home} />}
      {screen === 'endless' && <EndlessScreen onExit={home} />}
      {screen === 'classic' && <ClassicScreen onExit={home} />}
      {screen === 'gallery' && <GalleryScreen onExit={home} />}
      {screen === 'settings' && <SettingsScreen onExit={home} />}
    </div>
  );
}
