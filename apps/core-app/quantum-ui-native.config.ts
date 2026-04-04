import * as SecureStore from 'expo-secure-store';
import type { MobileAxiosConfig } from '@vritti/quantum-ui-native/utils';

const config: MobileAxiosConfig = {
  baseURL: 'https://api.vrittiai.com/api',
  auth: {
    refreshEndpoint: 'auth/mobile/refresh-tokens',
  },
  storage: {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    deleteItem: SecureStore.deleteItemAsync,
  },
  onSessionExpired: () => {
    // TODO: navigate to login screen when navigation is set up
  },
};

export default config;
