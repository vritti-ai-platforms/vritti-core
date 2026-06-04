import { axios } from '@vritti/quantum-ui-native/utils';
import type { CloudDeploymentDto, CloudDeploymentsResponse, Deployment } from '../../types/deployment';
import { config } from '../../config/env';

const DEPLOYMENTS_ENDPOINT = 'cloud-api/deployments/all';

interface ParsedApiBaseURL {
  protocol: string;
  hostname: string;
  port: string;
}

export function getDeployments(): Promise<Deployment[]> {
  return axios
    .get<CloudDeploymentsResponse>(DEPLOYMENTS_ENDPOINT, {
      baseURL: config.api.deploymentsBaseUrl,
      public: true,
    })
    .then((r) => r.data.result.map(mapDeployment));
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
