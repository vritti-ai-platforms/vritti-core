import '../../global.css';
// Runs AFTER MF async boundary — shared modules are safe to import here.
import { registerRemotes } from '@module-federation/enhanced/runtime';
import { enableScreens } from 'react-native-screens';
import { STARTUP_REMOTES } from './config/remotes.config';

enableScreens();

if (STARTUP_REMOTES.length > 0) {
  registerRemotes(
    STARTUP_REMOTES.map((remote) => ({
      name: remote.name,
      entry: remote.entry,
    })),
  );
}

export { default } from './App';
