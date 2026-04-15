import React, { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Cache lazily-loaded components to avoid re-fetching on re-renders
const remoteCache = new Map<string, React.LazyExoticComponent<React.ComponentType>>();

type RemoteModule = { default: React.ComponentType };

const commerceModules = {
  './Items': () => import('commerce/Items'),
  './Categories': () => import('commerce/Categories'),
  './Modifiers': () => import('commerce/Modifiers'),
} as Record<string, () => Promise<RemoteModule>>;

const remoteModuleLoaders = {
  commerce: commerceModules,
} as Record<string, Record<string, () => Promise<RemoteModule>>>;

interface RemoteScreenProps {
  /** MF container name (e.g. 'commerce') */
  remoteName: string;
  /** Module path exposed by the remote (e.g. './Items') */
  moduleName: string;
}

/**
 * Lazy-loads a screen from a Module Federation V2 remote.
 *
 * The remote exposes are a finite set, so we use static import() specifiers that
 * align with Re.Pack's V2 manifest-based module resolution.
 */
export function RemoteScreen({ remoteName, moduleName }: RemoteScreenProps) {
  const normalizedModuleName = moduleName.startsWith('./')
    ? moduleName
    : `./${moduleName}`;
  const cacheKey = `${remoteName}/${normalizedModuleName}`;

  if (!remoteCache.has(cacheKey)) {
    const loader = remoteModuleLoaders[remoteName]?.[normalizedModuleName];
    if (!loader) {
      throw new Error(`Unsupported remote module: ${cacheKey}`);
    }

    const LazyComponent = React.lazy(async () => {
      const mod = await loader();
      if (!mod?.default) {
        throw new Error(
          `Remote module ${cacheKey} does not export a default component`,
        );
      }
      return { default: mod.default };
    });
    remoteCache.set(cacheKey, LazyComponent);
  }

  const Component = remoteCache.get(cacheKey)!;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}

function LoadingFallback() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
