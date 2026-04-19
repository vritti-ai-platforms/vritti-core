import { Platform } from 'react-native';

export interface RemoteConfig {
  name: string;
  entry: string;
  runtimeName: string;
  containerFilename: string;
  registerAtStartup?: boolean;
  matchers?: string[];
}

function buildRemoteEntry(devPort: number, prodPath: string) {
  if (__DEV__) {
    return `http://${__DEV_MF_HOST__}:${devPort}/${Platform.OS}/mf-manifest.json`;
  }

  return `https://mf.vrittiai.com/${prodPath}/${Platform.OS}/mf-manifest.json`;
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
