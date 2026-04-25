import type { PushScreenConfig } from '@vritti/quantum-ui-native';
import { AccountPasswordScreen } from '../../screens/account/AccountPasswordScreen';
import { AccountProfileScreen } from '../../screens/account/AccountProfileScreen';
import { AccountSessionsScreen } from '../../screens/account/AccountSessionsScreen';
import { AccountThemeScreen } from '../../screens/account/AccountThemeScreen';

export type AccountDetailRoute = 'AccountProfile' | 'AccountPassword' | 'AccountSessions' | 'AccountTheme';

export const accountRoutes: ReadonlyArray<PushScreenConfig<AccountDetailRoute>> = [
  { name: 'AccountProfile', title: 'Profile', component: AccountProfileScreen },
  { name: 'AccountPassword', title: 'Password', component: AccountPasswordScreen },
  { name: 'AccountSessions', title: 'Sessions', component: AccountSessionsScreen },
  { name: 'AccountTheme', title: 'Theme', component: AccountThemeScreen },
];
