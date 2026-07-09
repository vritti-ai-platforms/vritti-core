import { config } from '../../config/env';
import type { CloudDeploymentDto, CloudDeploymentsResponse, Deployment } from '../../types/deployment';

const DEPLOYMENTS_ENDPOINT = 'cloud-api/deployments/all';

interface ParsedApiBaseURL {
  protocol: string;
  hostname: string;
  port: string;
}

// Discovers deployments from the cloud catalog via global fetch, before any tenant/deployment is selected.
export function getDeployments(): Promise<Deployment[]> {
  const url = `${config.api.deploymentsBaseUrl.replace(/\/$/, '')}/${DEPLOYMENTS_ENDPOINT}`;

  return fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load deployments (${response.status})`);
      }
      return response.json() as Promise<CloudDeploymentsResponse>;
    })
    .then((data) => data.result.map(mapDeployment));
}

export function buildOrganizationApiBaseURL(deploymentBaseURL: string, subdomain: string): string {
  const rawDevBaseURL = getRawDevCoreBaseURL();
  if (rawDevBaseURL) {
    return rawDevBaseURL;
  }

  const normalizedSubdomain = subdomain.trim().toLowerCase();
  const parsed = tryParseApiBaseURL(deploymentBaseURL);

  if (!normalizedSubdomain || !parsed) {
    return ensureOrigin(deploymentBaseURL);
  }

  const baseHostname = parsed.hostname.startsWith('api.') ? parsed.hostname.slice(4) : parsed.hostname;
  const tenantHostname = baseHostname.startsWith(`${normalizedSubdomain}.`)
    ? baseHostname
    : `${normalizedSubdomain}.${baseHostname}`;

  return formatOrigin(parsed.protocol, tenantHostname, parsed.port);
}

export function buildPublicApiBaseURL(deploymentBaseURL: string): string {
  const rawDevBaseURL = getRawDevCoreBaseURL();
  if (rawDevBaseURL) {
    return rawDevBaseURL;
  }

  const parsed = tryParseApiBaseURL(deploymentBaseURL);
  if (!parsed) {
    return deploymentBaseURL;
  }

  const hostname = parsed.hostname.startsWith('api.') ? parsed.hostname : `api.${parsed.hostname}`;

  return formatOrigin(parsed.protocol, hostname, parsed.port);
}

function mapDeployment(deployment: CloudDeploymentDto): Deployment {
  return {
    ...deployment,
    url: ensureOrigin(deployment.url),
    status: deployment.status === 'Provisioning' ? 'provisioning' : deployment.status,
  };
}

function ensureOrigin(url: string): string {
  const parsed = tryParseApiBaseURL(url);
  if (!parsed) {
    return url;
  }

  return formatOrigin(parsed.protocol, parsed.hostname, parsed.port);
}

function formatOrigin(protocol: string, hostname: string, port: string): string {
  return `${protocol}//${hostname}${port ? `:${port}` : ''}`;
}

function tryParseApiBaseURL(url: string): ParsedApiBaseURL | null {
  try {
    const parsed = new globalThis.URL(url) as unknown as ParsedApiBaseURL;
    return {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
    };
  } catch {
    return null;
  }
}

function getRawDevCoreBaseURL(): string | null {
  if (!config.isDev || !config.api.devRawCoreBaseUrl) {
    return null;
  }
  if (__DEV__) {
    console.log('[dev] using raw core base URL:', config.api.devRawCoreBaseUrl);
  }
  return config.api.devRawCoreBaseUrl;
}
