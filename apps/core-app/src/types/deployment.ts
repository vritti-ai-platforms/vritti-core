export type DeploymentStatus = 'active' | 'stopped' | 'provisioning';
export type DeploymentType = 'shared' | 'dedicated';

export interface Deployment {
  id: string;
  name: string;
  url: string;
  status: DeploymentStatus;
  type: DeploymentType;
  regionId: string;
  cloudProviderId: string;
  regionName?: string;
  regionCode?: string;
  cloudProviderName?: string;
  cloudProviderCode?: string;
  organizationCount: number;
  createdAt: string;
  updatedAt: string | null;
}
