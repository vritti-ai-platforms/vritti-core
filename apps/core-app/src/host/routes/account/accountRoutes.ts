import type { PushScreenConfig } from '@vritti/quantum-ui-native';
import { PasswordScreen } from '../../screens/account/PasswordScreen';
import { ProfileScreen } from '../../screens/account/ProfileScreen';
import { SessionsScreen } from '../../screens/account/SessionsScreen';

export type AccountDetailRoute = 'AccountProfile' | 'AccountPassword' | 'AccountSessions';

export const accountRoutes: ReadonlyArray<PushScreenConfig<AccountDetailRoute>> = [
  { name: 'AccountProfile', title: 'Profile', component: ProfileScreen },
  { name: 'AccountPassword', title: 'Password', component: PasswordScreen },
  { name: 'AccountSessions', title: 'Sessions', component: SessionsScreen },
];
