import { Platform } from 'react-native';
import { config } from './env';

export interface RemoteConfig {
  name: string;
  entry: string;
  runtimeName: string;
  containerFilename: string;
  registerAtStartup?: boolean;
  matchers?: string[];
}

function buildRemoteEntry(devPort: number, prodPath: string) {
  if (config.isDev) {
    return `http://${config.mf.devHost}:${devPort}/${Platform.OS}/mf-manifest.json`;
  }
  return `${config.mf.hostUrl}/${prodPath}/${Platform.OS}/mf-manifest.json`;
}

export const ALL_REMOTES: RemoteConfig[] = [
  {
    name: 'commerce-ma',
    entry: buildRemoteEntry(9002, 'commerce-ma'),
    runtimeName: 'commerce_ma',
    containerFilename: 'commerce-ma.container.js.bundle',
    matchers: ['commerce-ma', 'commerce', 'commerce_ma'],
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

export function resolveRemoteName(remoteEntry?: string) {
  if (!remoteEntry) return 'commerce-ma';

  const matchedRemote = ALL_REMOTES.find((remote) => {
    if (remote.entry === remoteEntry) return true;

    return (remote.matchers ?? []).some((matcher) => remoteEntry.includes(matcher));
  });

  return matchedRemote?.name ?? 'commerce-ma';
}
