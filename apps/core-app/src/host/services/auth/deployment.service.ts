import { axios } from '@vritti/quantum-ui-native/utils';
import type { CloudDeploymentDto, CloudDeploymentsResponse, Deployment } from '../../types/deployment';

const DEPLOYMENTS_API_BASE_URL = __DEPLOYMENTS_API_BASE_URL__;
const DEV_RAW_CORE_BASE_URL = __DEV_RAW_CORE_BASE_URL__;
const DEPLOYMENTS_ENDPOINT = 'cloud-api/deployments/all';

interface ParsedApiBaseURL {
  protocol: string;
  hostname: string;
  port: string;
}

export const getDeployments = async (): Promise<Deployment[]> => {
  const response = await axios.get<CloudDeploymentsResponse>(DEPLOYMENTS_ENDPOINT, {
    baseURL: DEPLOYMENTS_API_BASE_URL,
    public: true,
  });
  return response.data.result.map(mapDeployment);
};

export const buildOrganizationApiBaseURL = (deploymentBaseURL: string, subdomain: string): string => {
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
};

export const buildPublicApiBaseURL = (deploymentBaseURL: string): string => {
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
};

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
  const value = DEV_RAW_CORE_BASE_URL?.trim();
  return __DEV__ && value ? value : null;
}
