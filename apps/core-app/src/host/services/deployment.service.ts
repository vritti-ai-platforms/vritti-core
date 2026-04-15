import type { Deployment } from '../types/deployment';

// Stub — replace with real axios call when API is wired up
// GET /admin-api/deployments
export function getDeployments(): Promise<Deployment[]> {
  return Promise.resolve(MOCK_DEPLOYMENTS);
}

const MOCK_DEPLOYMENTS: Deployment[] = [
  {
    id: '1',
    name: 'US East Production',
    url: 'https://nexus-us-east.vritti.io',
    status: 'active',
    type: 'shared',
    regionId: 'r1',
    cloudProviderId: 'cp1',
    regionName: 'US East',
    regionCode: 'us-east-1',
    cloudProviderName: 'Amazon Web Services',
    cloudProviderCode: 'aws',
    organizationCount: 12,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-06-01T08:30:00Z',
  },
  {
    id: '2',
    name: 'EU West Production',
    url: 'https://nexus-eu-west.vritti.io',
    status: 'active',
    type: 'shared',
    regionId: 'r2',
    cloudProviderId: 'cp1',
    regionName: 'EU West',
    regionCode: 'eu-west-1',
    cloudProviderName: 'Amazon Web Services',
    cloudProviderCode: 'aws',
    organizationCount: 8,
    createdAt: '2024-02-20T10:00:00Z',
    updatedAt: null,
  },
  {
    id: '3',
    name: 'US West Staging',
    url: 'https://nexus-us-west-staging.vritti.io',
    status: 'provisioning',
    type: 'dedicated',
    regionId: 'r3',
    cloudProviderId: 'cp2',
    regionName: 'US West',
    regionCode: 'us-west-2',
    cloudProviderName: 'Google Cloud',
    cloudProviderCode: 'gcp',
    organizationCount: 0,
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: null,
  },
  {
    id: '4',
    name: 'APAC Development',
    url: 'https://nexus-apac-dev.vritti.io',
    status: 'stopped',
    type: 'shared',
    regionId: 'r4',
    cloudProviderId: 'cp1',
    regionName: 'Asia Pacific',
    regionCode: 'ap-south-1',
    cloudProviderName: 'Amazon Web Services',
    cloudProviderCode: 'aws',
    organizationCount: 3,
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-10-15T12:00:00Z',
  },
];
