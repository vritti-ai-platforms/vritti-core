import { configureMobileAxios } from '@vritti/quantum-ui-native/utils';
import { registerRootComponent } from 'expo';
import App from './App';
import mobileAxiosConfig from './quantum-ui-native.config';

// Configure mobile axios BEFORE rendering
configureMobileAxios(mobileAxiosConfig);

registerRootComponent(App);
