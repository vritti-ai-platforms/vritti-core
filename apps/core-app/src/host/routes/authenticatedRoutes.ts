import type { PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { type AccountDetailRoute, accountRoutes } from './account/accountRoutes';
import { type HomeRoute, homeRoutes } from './home/homeRoutes';

export type HostAppRoute = HomeRoute | AccountDetailRoute;

export const authenticatedRoutes: ReadonlyArray<PushScreenConfig<HostAppRoute>> = [...homeRoutes, ...accountRoutes];
