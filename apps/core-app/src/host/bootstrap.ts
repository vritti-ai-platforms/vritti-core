import '../../global.css';
// Runs AFTER MF async boundary — shared modules are safe to import here.
// The host doesn't render Select, but Module Federation only PROVIDES a shared module the
// provider actually imports. This side-effect import puts Select in the host bundle so
// micro-apps that consume it (import: false) can resolve it. Mirrors App.tsx → BottomSheet.
import '@vritti/quantum-ui-native/Select';
import { registerRemotes } from '@module-federation/enhanced/runtime';
import { getAxios } from '@vritti/quantum-ui-native/utils';
import { enableScreens } from 'react-native-screens';
import { ALL_REMOTES } from './config/remotes.config';
import { getSelectedBusinessUnitId } from './config/storage';

enableScreens();

registerRemotes(
  ALL_REMOTES.filter((remote) => remote.registerAtStartup !== false).map((remote) => ({
    name: remote.name,
    entry: remote.entry,
  })),
);

// Tag every API request with the active business unit so the server scopes data to it.
// Mirrors core-web's x-bu-id header; the id is the persisted MMKV selection, kept in sync
// by PermissionProvider. Registered once here at startup.
getAxios().interceptors.request.use((config) => {
  const buId = getSelectedBusinessUnitId();
  if (buId) config.headers.set('x-bu-id', buId);
  return config;
});

export { default } from './App';
