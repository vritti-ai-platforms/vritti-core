import type { LookupOrganization } from '../services/auth.service';

export type RootStackParamList = {
  DeploymentSelection: undefined;
  EmailLookup: { deploymentUrl: string };
  OrgSelection: { email: string; organizations: LookupOrganization[] };
  Login: { email: string; organizationId: string; organizationName: string };
};
