import '../../global.css';
// Runs AFTER MF async boundary — shared modules are safe to import here.
import { registerRemotes } from '@module-federation/enhanced/runtime';
import { Platform } from 'react-native';
import { enableScreens } from 'react-native-screens';

enableScreens();

registerRemotes([
  {
    name: 'commerce-ma',
    entry: `http://${Platform.OS === 'android' ? '10.0.2.2' : 'localhost'}:9002/${Platform.OS}/mf-manifest.json`,
  },
]);

export { default } from './App';
