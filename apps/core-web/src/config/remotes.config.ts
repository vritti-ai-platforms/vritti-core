export interface RemoteConfig {
  name: string;
  entry: string;
  exposedModule: string;
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
const buildRemoteEntry = (config: {
  portEnvVar: string;
  prodPath: string;
}): string => {
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
