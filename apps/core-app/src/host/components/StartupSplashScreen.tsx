import { SplashScreen } from '@vritti/quantum-ui-native/SplashScreen';
import { Image } from 'react-native';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const logo = require('../../../assets/vritti-logo.png');

interface StartupSplashScreenProps {
  statusText: string;
}

export function StartupSplashScreen({ statusText }: StartupSplashScreenProps) {
  return (
    <SplashScreen
      logo={<Image source={logo} style={{ width: 72, height: 72 }} resizeMode="contain" />}
      title="Vritti Core"
      subtitle="Inventory and operations workspace"
      statusText={statusText}
      showSpinner
    />
  );
}
