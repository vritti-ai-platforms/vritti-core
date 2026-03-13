// Remote Module Federation Configuration
//
// Defines all remote micro-frontends loaded by the host application.
// All remotes are loaded unconditionally at startup.
//
// ENVIRONMENT-DRIVEN APPROACH:
// - Automatically detects protocol (HTTP/HTTPS) from window.location.protocol
// - Uses PUBLIC_ prefixed environment variables (Rsbuild convention)
// - Local mode: PORT env vars defined → port-based routing
// - Production mode: PORT env vars undefined → path-based routing with PUBLIC_MF_BASE_URL

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
  portEnvVar: string; // Environment variable name (e.g., 'PUBLIC_CLOUD_MF_PORT')
  prodPath: string;
}): string => {
  const { protocol, host } = getEnvironmentConfig();

  // Check if the port environment variable is defined
  // Rsbuild exposes PUBLIC_ prefixed env vars via import.meta.env
  const remotePort = getEnvVar(config.portEnvVar);

  if (remotePort) {
    // Local: port-based routing with environment variable port
    // Example: http://local.vrittiai.com:3001/mf-manifest.json
    return `${protocol}://${host}:${remotePort}/mf-manifest.json`;
  } else {
    // Production: path-based routing with MF_BASE_URL
    // Example: https://mf.vrittiai.com/auth-microfrontend/mf-manifest.json
    const mfBaseUrl = import.meta.env.PUBLIC_MF_BASE_URL || `${protocol}://${host}`;
    return `${mfBaseUrl}/${config.prodPath}/mf-manifest.json`;
  }
};

// Registry of all remote micro-frontends — add new remotes here as they are developed
//
// Local example (with PUBLIC_CLOUD_MF_PORT=3002):
//   https://local.vrittiai.com:3002/mf-manifest.json
//
// Production example (with PUBLIC_MF_BASE_URL=https://mf.vrittiai.com):
//   https://mf.vrittiai.com/cloud-microfrontend/mf-manifest.json
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
