import type { QuantumUINativeConfig } from '@vritti/quantum-ui-native/utils';
import * as Keychain from 'react-native-keychain';
import { config } from './src/host/config/env';

export const storage: QuantumUINativeConfig['storage'] = {
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

/**
 * Everything quantum-ui-native needs, in one object.
 *
 * The package ships no endpoint defaults — this app names every URL it talks to, and the ones that
 * vary by deployment come from the environment.
 */
const quantumUINativeConfig: QuantumUINativeConfig = {
  axios: {
    baseURL: config.api.fallbackBaseUrl,
  },
  auth: {
    refreshEndpoint: 'auth/mobile/refresh-tokens',
  },
  // core-server serves two GraphQL surfaces on separate paths: /graphql (the public storefront
  // schema) and the internal one this app talks to. Which one is deployment config, hence the env var.
  graphql: {
    httpEndpoint: config.api.graphqlPath,
  },
  views: {
    viewsEndpoint: 'table-views',
    statesEndpoint: 'table-states',
  },
  storage,
  onSessionExpired: () => {
    // TODO: navigate to login screen when navigation is set up
  },
};

export default quantumUINativeConfig;
