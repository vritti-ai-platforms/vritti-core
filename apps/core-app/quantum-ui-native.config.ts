import type { MobileAxiosConfig } from '@vritti/quantum-ui-native/utils';
import * as Keychain from 'react-native-keychain';
import { config } from './src/host/config/env';

export const storage: MobileAxiosConfig['storage'] = {
  async getItem(key) {
    const credentials = await Keychain.getGenericPassword({
      service: `${config.security.keychainServicePrefix}.${key}`,
    });

    return credentials ? credentials.password : null;
  },

  async setItem(key, value) {
    await Keychain.setGenericPassword(key, value, {
      service: `${config.security.keychainServicePrefix}.${key}`,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async deleteItem(key) {
    await Keychain.resetGenericPassword({
      service: `${config.security.keychainServicePrefix}.${key}`,
    });
  },
};

const mobileAxiosConfig: MobileAxiosConfig = {
  baseURL: config.api.fallbackBaseUrl,
  auth: {
    refreshEndpoint: 'auth/mobile/refresh-tokens',
  },
  storage,
  onSessionExpired: () => {
    // TODO: navigate to login screen when navigation is set up
  },
};

export default mobileAxiosConfig;
