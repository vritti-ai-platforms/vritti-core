import { Platform } from 'react-native';
import { config } from './env';

export interface RemoteConfig {
  name: string;
  code: string;
  entry: string;
  runtimeName: string;
  containerFilename: string;
  registerAtStartup?: boolean;
}

// Builds a remote's per-OS manifest URL: its local dev server in dev, otherwise /<code>/<os>/ on the MF host
function buildManifestUrl(devPort: number, code: string) {
  if (config.isDev) {
    return `http://${config.mf.devHost}:${devPort}/${Platform.OS}/mf-manifest.json`;
  }
  return `${config.mf.hostUrl}/${code}/${Platform.OS}/mf-manifest.json`;
}

export const ALL_REMOTES: RemoteConfig[] = [
  {
    name: 'commerce-ma',
    code: 'commerce-ma',
    entry: buildManifestUrl(9002, 'commerce-ma'),
    runtimeName: 'commerce_ma',
    containerFilename: 'commerce-ma.container.js.bundle',
  },
];

export function getRemoteConfig(remoteName: string) {
  return ALL_REMOTES.find((remote) => remote.name === remoteName);
}

export function getRemoteConfigByRuntimeName(runtimeName?: string) {
  if (!runtimeName) return undefined;
  return ALL_REMOTES.find((remote) => remote.runtimeName === runtimeName);
}

export function getRemoteAssetBase(remote: RemoteConfig) {
  return remote.entry.replace(/\/mf-manifest\.json$/, '/');
}

// The MF container name for a catalog microfrontend code; an unknown code comes back as is, so loading it fails
// visibly instead of falling back to another remote
export function remoteNameForCode(microfrontendCode: string) {
  return ALL_REMOTES.find((remote) => remote.code === microfrontendCode)?.name ?? microfrontendCode;
}
