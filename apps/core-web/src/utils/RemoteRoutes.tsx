import { loadRemote } from '@module-federation/runtime';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { type RouteObject, useRoutes } from 'react-router-dom';
import { MicrofrontendSkeletonFullPage } from './MircrofrontendFullPageSkeleton';

const loadRemoteModule = async (remoteName: string, moduleName: string) => {
  try {
    const module = await loadRemote(`${remoteName}/${moduleName}`);
    return (module as { default?: unknown })?.default || module;
  } catch (error) {
    console.error(`[RemoteRoutes] Failed to load ${remoteName}/${moduleName}:`, error);
    return undefined;
  }
};

export const RemoteRoutes = ({
  dataKey,
  moduleName,
  remoteName,
}: {
  dataKey?: string;
  moduleName: string;
  remoteName: string;
}) => {
  const [ready, setReady] = useState(false);
  const [routes, setRoutes] = useState<RouteObject[]>([]);
  const [errorLoading, setErrorLoading] = useState(false);
  const [routeCache] = useState<Map<string, unknown>>(new Map());

  const getRoutesFromRemote = useCallback(
    async (remoteNameArg: string, moduleNameArg: string) => {
      const cacheKey = `${remoteNameArg}/${moduleNameArg}`;

      if (!routeCache.has(cacheKey)) {
        const loadedModule = await loadRemoteModule(remoteNameArg, moduleNameArg);
        routeCache.set(cacheKey, loadedModule);
      }

      return routeCache.get(cacheKey);
    },
    [routeCache],
  );

  useEffect(() => {
    const initializeRoutes = async () => {
      try {
        const loadedRoutes = await getRoutesFromRemote(remoteName, moduleName);

        const routeModule = loadedRoutes as Record<string, RouteObject[]> | RouteObject[];
        const extractedRoutes =
          (dataKey ? (routeModule as Record<string, RouteObject[]>)?.[dataKey] : routeModule) || [];

        setRoutes(extractedRoutes as RouteObject[]);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setReady(true);
      } catch (error) {
        console.error(`[RemoteRoutes] Error initializing routes:`, error);
        setErrorLoading(true);
      }
    };

    initializeRoutes();
  }, [remoteName, moduleName, dataKey, getRoutesFromRemote]);

  const routing = useRoutes(routes);

  if (errorLoading) {
    return <div>Failed to load remote module. Please check if the microfrontend is running.</div>;
  }

  if (!ready) {
    return <MicrofrontendSkeletonFullPage />;
  }

  return <Suspense fallback={<MicrofrontendSkeletonFullPage />}>{routing}</Suspense>;
};
