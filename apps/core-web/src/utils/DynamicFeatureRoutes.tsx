import { Spinner } from '@vritti/quantum-ui/Spinner';
import { useMemo } from 'react';
import { Navigate, type RouteObject, useLocation, useRoutes } from 'react-router-dom';
import { usePermissionContext } from '../providers/PermissionProvider';
import { RemoteRoutes } from './RemoteRoutes';

// Dynamically builds routes from resolved permission features and renders them
export const DynamicFeatureRoutes = () => {
  const { features, selectedBuId, isLoadingPermissions } = usePermissionContext();

  const routes = useMemo<RouteObject[]>(() => {
    if (!selectedBuId || features.length === 0) return [];

    // Plan-locked features are upsell-only — their remote is never mounted (no route in the DOM).
    // BU-locked features stay routable: the page renders with every action gated red.
    const routable = features.filter((f) => !(f.locked && f.lockReason === 'PLAN'));

    return routable.map((feature) => {
      const routePrefix = feature.route.routePrefix.replace(/^\//, '');
      return {
        path: `${routePrefix}/*`,
        element: (
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
