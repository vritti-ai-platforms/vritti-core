import { Spinner } from '@vritti/quantum-ui/Spinner';
import type { PermissionFeature } from '@vritti/quantum-ui/types/catalog-resolver';
import { useMemo } from 'react';
import { Navigate, type RouteObject, useRoutes } from 'react-router-dom';
import { ServiceSetupRequired } from '../components/ServiceSetupRequired';
import { Upsell } from '../components/Upsell';
import { resolveRemoteName } from '../config/remotes.config';
import { usePermissionContext } from '../providers/PermissionProvider';
import { RemoteRoutes } from './RemoteRoutes';

// Dynamically builds routes from resolved permission features and renders them
export const DynamicFeatureRoutes = () => {
  const { features, workspace, isLoadingPermissions } = usePermissionContext();

  const routes = useMemo<RouteObject[]>(() => {
    if (!workspace || features.length === 0) return [];

    // A locked feature renders an explainer instead of mounting the remote: an upsell for a plan lock, a
    // setup prompt when the org hasn't provisioned a service it needs. Site locks stay mounted — the
    // feature itself works, its individual actions are gated inside.
    const lockElement = (feature: PermissionFeature) => {
      if (!feature.locked) return null;
      switch (feature.lockReason) {
        case 'PLAN':
          return <Upsell featureName={feature.name} unlockPlans={feature.unlockPlans} upsell={feature.upsell} />;
        case 'SERVICE':
          return <ServiceSetupRequired featureName={feature.name} missingServices={feature.missingServices} />;
        default:
          return null;
      }
    };

    const featureRoutes: RouteObject[] = features.map((feature) => {
      const routePrefix = feature.route.routePrefix.replace(/^\//, '');
      return {
        path: `${routePrefix}/*`,
        element: lockElement(feature) ?? (
          <RemoteRoutes
            key={feature.code}
            remoteName={resolveRemoteName(feature.route.remoteEntry)}
            remoteEntry={feature.route.remoteEntry}
            moduleName={feature.route.exposedModule}
          />
        ),
      };
    });

    // Workspace root lands on the first feature
    const firstPrefix = features[0].route.routePrefix.replace(/^\//, '');
    featureRoutes.push({ index: true, element: <Navigate to={firstPrefix} replace /> });

    return featureRoutes;
  }, [features, workspace]);

  // No location argument on purpose: passing one makes react-router wrap descendants in its own
  // LocationContext, which defaults search and hash to '' — that leaves useSearchParams permanently
  // empty inside every remote. Both parent routes already end in a splat, so matching is unaffected.
  const routeElement = useRoutes(routes);

  if (!workspace) {
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
        <p className="text-sm font-medium">No features available in this workspace yet</p>
        <p className="text-xs text-muted-foreground mt-2">
          Your role here doesn't include any features. Ask your administrator for access.
        </p>
      </div>
    );
  }

  return routeElement ?? null;
};
