import '../../global.css';
// Runs AFTER MF async boundary — shared modules are safe to import here.
// The host doesn't render Select, but Module Federation only PROVIDES a shared module the
// provider actually imports. This side-effect import puts Select in the host bundle so
// micro-apps that consume it (import: false) can resolve it. Mirrors App.tsx → BottomSheet.
import '@vritti/quantum-ui-native/Select';
import { registerRemotes } from '@module-federation/enhanced/runtime';
import { configureMobileAxios } from '@vritti/quantum-ui-native/utils';
import { enableScreens } from 'react-native-screens';
import mobileAxiosConfig from '../../quantum-ui-native.config';
import { ALL_REMOTES } from './config/remotes.config';

enableScreens();

// Register the Keychain storage adapter + base axios config eagerly, before any screen renders.
// Session restore (initializeMobileSession) later refines the base URL/tokens — this is idempotent.
// Without it, the first storage write (e.g. setMobileBaseURL on deployment select) throws
// "Mobile axios storage is not configured" because the adapter was only set inside a React effect.
configureMobileAxios(mobileAxiosConfig);

registerRemotes(
  ALL_REMOTES.filter((remote) => remote.registerAtStartup !== false).map((remote) => ({
    name: remote.name,
    entry: remote.entry,
  })),
);

export { default } from './App';
