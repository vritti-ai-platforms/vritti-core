// Runs AFTER MF async boundary — shared modules are safe to import here.
import { enableScreens } from 'react-native-screens';
import { configureMobileAxios } from '@vritti/quantum-ui-native/utils';
import mobileAxiosConfig from '../../quantum-ui-native.config';

configureMobileAxios(mobileAxiosConfig);
enableScreens();

export { default } from './App';
