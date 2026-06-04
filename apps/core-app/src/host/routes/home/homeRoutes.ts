import type { PushScreenConfig } from '@vritti/quantum-ui-native';
import { HomeTabsScreen } from '../../screens/home/HomeTabsScreen';

export type HomeRoute = 'HomeTabs';

export const homeRoutes: ReadonlyArray<PushScreenConfig<HomeRoute>> = [
  {
    name: 'HomeTabs',
    headerShown: false,
    component: HomeTabsScreen,
  },
];
