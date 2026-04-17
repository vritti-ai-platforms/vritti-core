import { axios } from '@vritti/quantum-ui-native/utils';
import type { CloudDeploymentDto, CloudDeploymentsResponse, Deployment } from '../../types/deployment';

const DEPLOYMENTS_API_BASE_URL = __DEPLOYMENTS_API_BASE_URL__;
const DEPLOYMENTS_ENDPOINT = 'cloud-api/deployments/all';

export async function getDeployments(): Promise<Deployment[]> {
  const response = await axios.get<CloudDeploymentsResponse>(DEPLOYMENTS_ENDPOINT, {
    baseURL: DEPLOYMENTS_API_BASE_URL,
    public: true,
  });
  return response.data.result.map(mapDeployment);
}

export function buildOrganizationApiBaseURL(deploymentBaseURL: string, subdomain: string): string {
  const normalizedSubdomain = subdomain.trim().toLowerCase();
  if (!normalizedSubdomain) {
    return deploymentBaseURL;
  }

  const [protocol, remainder] = deploymentBaseURL.split('://');
  if (!protocol || !remainder) {
    return deploymentBaseURL;
  }

  if (remainder.startsWith(`${normalizedSubdomain}.`)) {
    return deploymentBaseURL;
  }

  return `${protocol}://${normalizedSubdomain}.${remainder}`;
}

export function buildPublicApiBaseURL(deploymentBaseURL: string): string {
  const [protocol, remainder] = deploymentBaseURL.split('://');
  if (!protocol || !remainder) {
    return deploymentBaseURL;
  }

  if (remainder.startsWith('api.')) {
    return deploymentBaseURL;
  }

  return `${protocol}://api.${remainder}`;
}

function mapDeployment(deployment: CloudDeploymentDto): Deployment {
  return {
    ...deployment,
    status: deployment.status === 'Provisioning' ? 'provisioning' : deployment.status,
  };
}
