import '../../global.css';
// Side-effect import puts Select in the host bundle so consuming micro-apps (import: false) can resolve it.
import '@vritti/quantum-ui-native/Select';
// Same rule for react-native-pager-view: the host renders no ScreenHeader tabs itself, but micro-apps'
// tabbed screens consume the host-provided share (import: false). Without this import the share getter is
// undefined in the remote ("getter is not a function") the moment a tabbed screen loads.
import 'react-native-pager-view';
import { registerRemotes } from '@module-federation/enhanced/runtime';
import { configureMobileAxios } from '@vritti/quantum-ui-native/utils';
import { enableScreens } from 'react-native-screens';
import mobileAxiosConfig from '../../quantum-ui-native.config';
import { ALL_REMOTES } from './config/remotes.config';

enableScreens();

// Register the Keychain storage adapter + base axios config eagerly, before any screen renders.
configureMobileAxios(mobileAxiosConfig);

registerRemotes(
  ALL_REMOTES.filter((remote) => remote.registerAtStartup !== false).map((remote) => ({
    name: remote.name,
    entry: remote.entry,
  })),
);

export { default } from './App';
