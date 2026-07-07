import { Spinner } from '@vritti/quantum-ui/Spinner';
import { useMemo } from 'react';
import { Navigate, type RouteObject, useLocation, useRoutes } from 'react-router-dom';
import { Upsell } from '../components/Upsell';
import { usePermissionContext } from '../providers/PermissionProvider';
import { RemoteRoutes } from './RemoteRoutes';

// Dynamically builds routes from resolved permission features and renders them
export const DynamicFeatureRoutes = () => {
  const { features, selectedBuId, isLoadingPermissions } = usePermissionContext();

  const routes = useMemo<RouteObject[]>(() => {
    if (!selectedBuId || features.length === 0) return [];

    // Every feature gets a route. Plan-locked features render an upsell screen instead of mounting the
    // remote; BU-locked (and unlocked) features mount the micro-app (BU-locked pages gate actions red).
    return features.map((feature) => {
      const routePrefix = feature.route.routePrefix.replace(/^\//, '');
      const planLocked = feature.locked && feature.lockReason === 'PLAN';
      return {
        path: `${routePrefix}/*`,
        element: planLocked ? (
          <Upsell featureName={feature.name} unlockPlans={feature.unlockPlans} upsell={feature.upsell} />
        ) : (
          <RemoteRoutes
            key={feature.code}
            remoteName="commerce"
            remoteEntry={feature.route.remoteEntry}
            moduleName={feature.route.exposedModule}
          />
        ),
      };
    });
  }, [features, selectedBuId]);

  const { pathname } = useLocation();
  const routeElement = useRoutes(routes, pathname);

  if (!selectedBuId) {
    return <Navigate to="/" replace />;
  }

  if (isLoadingPermissions) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  if (features.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm font-medium">No features available</p>
        <p className="text-xs text-muted-foreground mt-2">
          You don't have any features assigned at this business unit.
        </p>
      </div>
    );
  }

  return routeElement ?? null;
};
