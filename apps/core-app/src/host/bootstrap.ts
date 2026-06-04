import '../../global.css';
// Runs AFTER MF async boundary — shared modules are safe to import here.
import { registerRemotes } from '@module-federation/enhanced/runtime';
import { enableScreens } from 'react-native-screens';
import { ALL_REMOTES } from './config/remotes.config';

enableScreens();

registerRemotes(
  ALL_REMOTES.filter((remote) => remote.registerAtStartup !== false).map((remote) => ({
    name: remote.name,
    entry: remote.entry,
  })),
);

export { default } from './App';
