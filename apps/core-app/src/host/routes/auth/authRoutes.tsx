import type { PushScreenConfig } from '@vritti/quantum-ui-native';
import { DeploymentSelectionScreen } from '../../screens/auth/DeploymentSelectionScreen';
import { EmailLookupScreen } from '../../screens/auth/EmailLookupScreen';
import { LoginScreen } from '../../screens/auth/LoginScreen';
import { OrgSelectionScreen } from '../../screens/auth/OrgSelectionScreen';

export type AuthRoute = 'Deployment' | 'EmailLookup' | 'OrgSelection' | 'Login';

export const authRoutes: ReadonlyArray<PushScreenConfig<AuthRoute>> = [
  { name: 'Deployment', component: DeploymentSelectionScreen },
  { name: 'EmailLookup', component: EmailLookupScreen },
  { name: 'OrgSelection', component: OrgSelectionScreen },
  { name: 'Login', component: LoginScreen },
];
