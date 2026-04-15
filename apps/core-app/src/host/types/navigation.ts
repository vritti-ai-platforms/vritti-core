import type { LookupOrganization } from '../services/auth.service';

export type RootStackParamList = {
  // Auth flow
  DeploymentSelection: undefined;
  EmailLookup: { deploymentUrl: string };
  OrgSelection: { email: string; organizations: LookupOrganization[] };
  Login: { email: string; organizationId: string; organizationName: string };
  // Authenticated — MF shell
  Home: undefined;
};
