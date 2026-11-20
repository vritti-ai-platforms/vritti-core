export interface RemoteConfig {
  name: string;
  code: string;
  entry: string;
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
    PUBLIC_COMMERCE_MF_PORT: import.meta.env.PUBLIC_COMMERCE_MF_PORT,
    PUBLIC_COMMUNICATIONS_MF_PORT: import.meta.env.PUBLIC_COMMUNICATIONS_MF_PORT,
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

// Builds a remote's mf-manifest.json URL: its local dev server when the port is set, otherwise /<code>/ on the
// MF base URL (empty in deployed builds, so the host's own origin)
const buildManifestUrl = (config: { portEnvVar: string; code: string }): string => {
  const { protocol, host } = getEnvironmentConfig();

  // Check if the port environment variable is defined
  const remotePort = getEnvVar(config.portEnvVar);

  if (remotePort) {
    // Local: port-based routing with environment variable port
    return `${protocol}://${host}:${remotePort}/mf-manifest.json`;
  } else {
    // Deployed: path-based routing under the MF base URL
    const mfBaseUrl = import.meta.env.PUBLIC_MF_BASE_URL || `${protocol}://${host}`;
    return `${mfBaseUrl}/${config.code}/mf-manifest.json`;
  }
};

// The MF micro-apps the host loads, keyed by the catalog's microfrontend code and registered at startup (bootstrap)
export const ALL_REMOTES: RemoteConfig[] = [
  {
    name: 'commerce',
    code: 'commerce-mf',
    entry: buildManifestUrl({ portEnvVar: 'PUBLIC_COMMERCE_MF_PORT', code: 'commerce-mf' }),
  },
  {
    name: 'communications',
    code: 'communications-mf',
    entry: buildManifestUrl({ portEnvVar: 'PUBLIC_COMMUNICATIONS_MF_PORT', code: 'communications-mf' }),
  },
  {
    name: 'gitea',
    code: 'gitea-mf',
    entry: buildManifestUrl({ portEnvVar: 'PUBLIC_GITEA_MF_PORT', code: 'gitea-mf' }),
  },
];

// The MF container name for a catalog microfrontend code; an unknown code comes back as is, so loading it fails
// visibly instead of falling back to another remote
export function remoteNameForCode(microfrontendCode: string): string {
  return ALL_REMOTES.find((remote) => remote.code === microfrontendCode)?.name ?? microfrontendCode;
}
