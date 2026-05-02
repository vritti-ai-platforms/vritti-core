import type { PushScreenConfig } from '@vritti/quantum-ui-native';
import { PasswordScreen } from '../../screens/account/PasswordScreen';
import { ProfileScreen } from '../../screens/account/ProfileScreen';
import { SessionsScreen } from '../../screens/account/SessionsScreen';
import { ThemeScreen } from '../../screens/account/ThemeScreen';

export type AccountDetailRoute = 'AccountProfile' | 'AccountPassword' | 'AccountSessions' | 'AccountTheme';

export const accountRoutes: ReadonlyArray<PushScreenConfig<AccountDetailRoute>> = [
  { name: 'AccountProfile', title: 'Profile', component: ProfileScreen },
  { name: 'AccountPassword', title: 'Password', component: PasswordScreen },
  { name: 'AccountSessions', title: 'Sessions', component: SessionsScreen },
  { name: 'AccountTheme', title: 'Theme', component: ThemeScreen },
];
