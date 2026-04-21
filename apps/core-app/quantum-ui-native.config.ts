import type { MobileAxiosConfig } from '@vritti/quantum-ui-native/utils';
import * as Keychain from 'react-native-keychain';

const KEYCHAIN_SERVICE_PREFIX = 'com.anonymous.coreapp.secure';

export const storage: MobileAxiosConfig['storage'] = {
  async getItem(key) {
    const credentials = await Keychain.getGenericPassword({
      service: `${KEYCHAIN_SERVICE_PREFIX}.${key}`,
    });

    return credentials ? credentials.password : null;
  },

  async setItem(key, value) {
    await Keychain.setGenericPassword(key, value, {
      service: `${KEYCHAIN_SERVICE_PREFIX}.${key}`,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },

  async deleteItem(key) {
    await Keychain.resetGenericPassword({
      service: `${KEYCHAIN_SERVICE_PREFIX}.${key}`,
    });
  },
};

const config: MobileAxiosConfig = {
  baseURL: 'https://api.vrittiai.com/api',
  auth: {
    refreshEndpoint: 'auth/mobile/refresh-tokens',
  },
  storage,
  onSessionExpired: () => {
    // TODO: navigate to login screen when navigation is set up
  },
};

export default config;
