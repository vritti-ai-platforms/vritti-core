import { Platform } from 'react-native';

export interface RemoteConfig {
  name: string;
  entry: string;
  registerAtStartup?: boolean;
  matchers?: string[];
}

function getDevRemoteHost() {
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

function buildRemoteEntry(devPort: number, prodPath: string) {
  if (__DEV__) {
    return `http://${getDevRemoteHost()}:${devPort}/${Platform.OS}/mf-manifest.json`;
  }

  return `https://mf.vrittiai.com/${prodPath}/${Platform.OS}/mf-manifest.json`;
}

export const ALL_REMOTES: RemoteConfig[] = [
  {
    name: 'commerce-ma',
    entry: buildRemoteEntry(9002, 'commerce-ma'),
    // Loaded from the permission catalog instead of eagerly at bootstrap.
    registerAtStartup: false,
    matchers: ['commerce-ma', 'commerce'],
  },
];

export const STARTUP_REMOTES = ALL_REMOTES.filter(
  (remote) => remote.registerAtStartup,
);

export function getRemoteConfig(remoteName: string) {
  return ALL_REMOTES.find((remote) => remote.name === remoteName);
}

export function resolveRemoteName(remoteEntry?: string) {
  if (!remoteEntry) return 'commerce-ma';

  const matchedRemote = ALL_REMOTES.find((remote) => {
    if (remote.entry === remoteEntry) return true;

    return (remote.matchers ?? []).some((matcher) =>
      remoteEntry.includes(matcher),
    );
  });

  return matchedRemote?.name ?? 'commerce-ma';
}
