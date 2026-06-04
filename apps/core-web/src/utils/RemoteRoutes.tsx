import { loadRemote, registerRemotes } from '@module-federation/enhanced/runtime';
import { Suspense, useEffect, useRef, useState } from 'react';
import { type RouteObject, useRoutes } from 'react-router-dom';
import { MicrofrontendSkeletonFullPage } from './MircrofrontendFullPageSkeleton';

// Tracks which remotes have been dynamically registered
const registeredRemotes = new Set<string>();

// Global route cache — persists across component instances
const globalRouteCache = new Map<string, unknown>();

// Registers a remote on-the-fly if not already registered
function ensureRemoteRegistered(remoteName: string, remoteEntry?: string) {
  if (!remoteEntry || registeredRemotes.has(remoteName)) return;
  registerRemotes([{ name: remoteName, entry: remoteEntry }]);
  registeredRemotes.add(remoteName);
}

// Loads a remote module and extracts its default export
async function loadRemoteModule(remoteName: string, moduleName: string) {
  try {
    const cleanModule = moduleName.replace(/^\.\//, '');
    const module = await loadRemote(`${remoteName}/${cleanModule}`);
    return (module as { default?: unknown })?.default || module;
  } catch (error) {
    console.error(`[RemoteRoutes] Failed to load ${remoteName}/${moduleName}:`, error);
    return undefined;
  }
}

export const RemoteRoutes = ({
  dataKey,
  moduleName,
  remoteName,
  remoteEntry,
}: {
  dataKey?: string;
  moduleName: string;
  remoteName: string;
  remoteEntry?: string;
}) => {
  const [routes, setRoutes] = useState<RouteObject[]>([]);
  const [ready, setReady] = useState(false);
  const [errorLoading, setErrorLoading] = useState(false);
  const currentModuleRef = useRef(moduleName);

  useEffect(() => {
    currentModuleRef.current = moduleName;
    setReady(false);

    const init = async () => {
      try {
        ensureRemoteRegistered(remoteName, remoteEntry);

        const cacheKey = `${remoteName}/${moduleName}`;
        if (!globalRouteCache.has(cacheKey)) {
          const loaded = await loadRemoteModule(remoteName, moduleName);
          globalRouteCache.set(cacheKey, loaded);
        }

        // Bail if moduleName changed while loading
        if (currentModuleRef.current !== moduleName) return;

        const loadedRoutes = globalRouteCache.get(cacheKey);
        const routeModule = loadedRoutes as Record<string, RouteObject[]> | RouteObject[];
        const extracted = (dataKey ? (routeModule as Record<string, RouteObject[]>)?.[dataKey] : routeModule) || [];

        setRoutes(extracted as RouteObject[]);
        setReady(true);
      } catch (error) {
        console.error(`[RemoteRoutes] Error:`, error);
        if (currentModuleRef.current === moduleName) setErrorLoading(true);
      }
    };

    init();
  }, [remoteName, moduleName, dataKey, remoteEntry]);

  const routing = useRoutes(routes);

  if (errorLoading) {
    return <div>Failed to load remote module. Please check if the microfrontend is running.</div>;
  }

  if (!ready) {
    return <MicrofrontendSkeletonFullPage />;
  }

  return <Suspense fallback={<MicrofrontendSkeletonFullPage />}>{routing}</Suspense>;
};
