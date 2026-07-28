export interface RemoteConfig {
  name: string;
  entry: string;
  exposedModule: string;
  // Substrings matched against a catalog-supplied remoteEntry to pick this container
  matchers?: string[];
}

interface EnvironmentConfig {
  isLocal: boolean;
  protocol: string;
  host: string;
  port: string;
}

// Gets an environment variable by key — static mapping required for build-time replacement
const getEnvVar = (key: string): string | undefined => {
  const envMap: Record<string, string | undefined> = {
    PUBLIC_CLOUD_MF_PORT: import.meta.env.PUBLIC_CLOUD_MF_PORT,
    PUBLIC_COMMERCE_MF_PORT: import.meta.env.PUBLIC_COMMERCE_MF_PORT,
    PUBLIC_GITEA_MF_PORT: import.meta.env.PUBLIC_GITEA_MF_PORT,
    PUBLIC_MF_BASE_URL: import.meta.env.PUBLIC_MF_BASE_URL,
  };
  return envMap[key];
};

// Detects the current environment and protocol configuration
const getEnvironmentConfig = (): EnvironmentConfig => {
  // SSR/build time fallback
  if (typeof window === 'undefined') {
    return {
      isLocal: true,
      protocol: 'http',
      host: 'local.vrittiai.com',
      port: '3012',
    };
  }

  const { protocol, hostname, port } = window.location;

  // Detect local environment by hostname pattern
  const isLocal = hostname.includes('local.vrittiai.com');

  return {
    isLocal,
    protocol: protocol.replace(':', ''), // 'http' or 'https'
    host: hostname,
    port: port || (protocol === 'https:' ? '443' : '80'),
  };
};

// Builds the remote entry manifest URL based on environment and configuration
const buildRemoteEntry = (config: { portEnvVar: string; prodPath: string }): string => {
  const { protocol, host } = getEnvironmentConfig();

  // Check if the port environment variable is defined
  const remotePort = getEnvVar(config.portEnvVar);

  if (remotePort) {
    // Local: port-based routing with environment variable port
    return `${protocol}://${host}:${remotePort}/mf-manifest.json`;
  } else {
    // Production: path-based routing with MF_BASE_URL
    const mfBaseUrl = import.meta.env.PUBLIC_MF_BASE_URL || `${protocol}://${host}`;
    return `${mfBaseUrl}/${config.prodPath}/mf-manifest.json`;
  }
};

export const ALL_REMOTES: RemoteConfig[] = [
  {
    name: 'VrittiCloud',
    entry: buildRemoteEntry({
      portEnvVar: 'PUBLIC_CLOUD_MF_PORT',
      prodPath: 'cloud-microfrontend',
    }),
    exposedModule: 'routes',
  },
];

// Feature remotes registered lazily at route-mount time from the catalog's remoteEntry, not at
// startup like ALL_REMOTES. The MF container name is the one thing the web catalog does not carry,
// so it is matched from the entry URL — mirroring core-app's resolveRemoteName.
export const FEATURE_REMOTES: RemoteConfig[] = [
  {
    name: 'commerce',
    entry: buildRemoteEntry({ portEnvVar: 'PUBLIC_COMMERCE_MF_PORT', prodPath: 'commerce-mf' }),
    exposedModule: './Org/SalesChannels',
    matchers: ['commerce-mf', 'commerce'],
  },
  {
    name: 'gitea',
    entry: buildRemoteEntry({ portEnvVar: 'PUBLIC_GITEA_MF_PORT', prodPath: 'gitea-mf' }),
    exposedModule: './Org/Gitea',
    matchers: ['gitea-mf', 'gitea'],
  },
];

// Picks the MF container name for a catalog-supplied remoteEntry, defaulting to commerce so
// existing catalog entries keep mounting exactly as before
export const resolveRemoteName = (remoteEntry?: string): string => {
  if (!remoteEntry) return 'commerce';

  const matched = FEATURE_REMOTES.find(
    (remote) => remote.entry === remoteEntry || (remote.matchers ?? []).some((m) => remoteEntry.includes(m)),
  );

  return matched?.name ?? 'commerce';
};
