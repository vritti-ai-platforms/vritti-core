import type { PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { type AccountDetailRoute, accountRoutes } from './account/accountRoutes';
import { type HomeRoute, homeRoutes } from './home/homeRoutes';
import { type WorkspaceRoute, workspaceRoutes } from './workspace/workspaceRoutes';

export type HostAppRoute = HomeRoute | WorkspaceRoute | AccountDetailRoute;

export const authenticatedRoutes: ReadonlyArray<PushScreenConfig<HostAppRoute>> = [
  ...homeRoutes,
  ...workspaceRoutes,
  ...accountRoutes,
];
