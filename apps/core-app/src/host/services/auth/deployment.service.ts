import { axios } from '@vritti/quantum-ui-native/utils';
import type { CloudDeploymentDto, CloudDeploymentsResponse, Deployment } from '../../types/deployment';

const DEPLOYMENTS_API_BASE_URL = __DEPLOYMENTS_API_BASE_URL__;
const DEPLOYMENTS_ENDPOINT = 'cloud-api/deployments/all';

interface ParsedApiBaseURL {
  protocol: string;
  hostname: string;
  port: string;
}

export async function getDeployments(): Promise<Deployment[]> {
  const response = await axios.get<CloudDeploymentsResponse>(DEPLOYMENTS_ENDPOINT, {
    baseURL: DEPLOYMENTS_API_BASE_URL,
    public: true,
  });
  return response.data.result.map(mapDeployment);
}

export function buildOrganizationApiBaseURL(deploymentBaseURL: string, subdomain: string): string {
  const normalizedSubdomain = subdomain.trim().toLowerCase();
  const parsed = tryParseApiBaseURL(deploymentBaseURL);

  if (!normalizedSubdomain || !parsed) {
    return ensureApiBase(deploymentBaseURL);
  }

  const baseHostname = parsed.hostname.startsWith('api.') ? parsed.hostname.slice(4) : parsed.hostname;
  const tenantHostname = baseHostname.startsWith(`${normalizedSubdomain}.`)
    ? baseHostname
    : `${normalizedSubdomain}.${baseHostname}`;

  return ensureApiBase(formatOrigin(parsed.protocol, tenantHostname, parsed.port));
}

export function buildPublicApiBaseURL(deploymentBaseURL: string): string {
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
    url: ensureApiBase(deployment.url),
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

function ensureApiBase(url: string): string {
  const origin = ensureOrigin(url).replace(/\/$/, '');
  return origin.endsWith('/api') ? origin : `${origin}/api`;
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
