import '../../global.css';
// Runs AFTER MF async boundary — shared modules are safe to import here.
// The host doesn't render Select, but Module Federation only PROVIDES a shared module the
// provider actually imports. This side-effect import puts Select in the host bundle so
// micro-apps that consume it (import: false) can resolve it. Mirrors App.tsx → BottomSheet.
import '@vritti/quantum-ui-native/Select';
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
