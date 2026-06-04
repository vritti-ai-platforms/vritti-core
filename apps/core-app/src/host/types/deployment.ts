export type DeploymentStatus = 'active' | 'stopped' | 'provisioning';
export type DeploymentType = 'shared' | 'dedicated';

export interface Deployment {
  id: string;
  name: string;
  url: string;
  status: DeploymentStatus;
  type: DeploymentType;
  version: string | null;
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

export interface CloudDeploymentDto {
  id: string;
  name: string;
  url: string;
  status: 'active' | 'stopped' | 'Provisioning';
  type: DeploymentType;
  version: string | null;
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

export interface CloudDeploymentsResponse {
  result: CloudDeploymentDto[];
  count: number;
}
