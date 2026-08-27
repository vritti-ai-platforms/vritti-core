import '../../global.css';
// Side-effect import puts Select in the host bundle so consuming micro-apps (import: false) can resolve it.
import '@vritti/quantum-ui-native/Select';
// Same rule for react-native-pager-view: the host renders no ScreenHeader tabs itself, but micro-apps'
// tabbed screens consume the host-provided share (import: false). Without this import the share getter is
// undefined in the remote ("getter is not a function") the moment a tabbed screen loads.
import 'react-native-pager-view';
// react-native-bottom-tabs backs quantum's BottomNavigation.ios (iOS 26 detached search-role capsule) and
// @bottom-tabs/react-navigation is its react-navigation bridge. Both are eager shared singletons; import
// them here (like pager-view) so the shared scope is populated before the lazy App tree renders the tabs —
// the tab lib is a NATIVE module, so a missing share getter surfaces as "getter is not a function".
import 'react-native-bottom-tabs';
import '@bottom-tabs/react-navigation';
import { registerRemotes } from '@module-federation/enhanced/runtime';
import { configureQuantumUINative } from '@vritti/quantum-ui-native/utils';
import { configureReanimatedLogger } from 'react-native-reanimated';
import { enableScreens } from 'react-native-screens';
import quantumUINativeConfig from '../../quantum-ui-native.config';
import { ALL_REMOTES } from './config/remotes.config';

enableScreens();

// Reanimated strict mode false-positives on useAnimatedStyle's initial updater run ("Reading from `value`
// during component render") — every ScreenHeader render spams it. The reads are legitimate worklet reads;
// disable strict per the Reanimated logger docs (warnings for real errors still log).
configureReanimatedLogger({ strict: false });

// Register the Keychain storage adapter + base axios config eagerly, before any screen renders.
configureQuantumUINative(quantumUINativeConfig);

registerRemotes(
  ALL_REMOTES.filter((remote) => remote.registerAtStartup !== false).map((remote) => ({
    name: remote.name,
    entry: remote.entry,
  })),
);

export { default } from './App';
