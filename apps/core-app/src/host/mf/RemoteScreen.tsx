import { loadRemote, registerRemotes } from '@module-federation/enhanced/runtime';
import type { RouteProp } from '@react-navigation/native';
import React, { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getRemoteConfig } from '../config/remotes.config';

const registeredRemotes = new Map<string, string>();
const remoteCache = new Map<string, React.LazyExoticComponent<React.ComponentType>>();

type RemoteModule = { default: React.ComponentType };

export interface RemoteScreenParams {
  remoteName: string;
  moduleName: string;
  remoteEntry?: string;
}

interface RemoteScreenProps {
  route: RouteProp<Record<string, RemoteScreenParams>, string>;
}

function ensureRemoteRegistered(remoteName: string, remoteEntry?: string) {
  const resolvedEntry = remoteEntry ?? getRemoteConfig(remoteName)?.entry;
  if (!resolvedEntry) return;

  const currentEntry = registeredRemotes.get(remoteName);
  if (currentEntry === resolvedEntry) return;

  registerRemotes([{ name: remoteName, entry: resolvedEntry }]);
  registeredRemotes.set(remoteName, resolvedEntry);
}

async function loadRemoteModule(remoteName: string, moduleName: string) {
  const cleanModuleName = moduleName.replace(/^\.\//, '');
  const module = await loadRemote(`${remoteName}/${cleanModuleName}`);
  return (module as RemoteModule | undefined)?.default
    ? (module as RemoteModule).default
    : (module as React.ComponentType);
}

/**
 * Registers a remote manifest on-demand and lazy-loads a screen from it.
 * This mirrors the core-web setup: runtime registry + loadRemote() + cache.
 */
export const RemoteScreen = ({ route }: RemoteScreenProps) => {
  const { remoteName, moduleName, remoteEntry } = route.params;
  const normalizedModuleName = moduleName.startsWith('./') ? moduleName : `./${moduleName}`;
  const cacheKey = `${remoteName}|${remoteEntry ?? 'default'}|${normalizedModuleName}`;

  if (!remoteCache.has(cacheKey)) {
    const LazyComponent = React.lazy(async () => {
      ensureRemoteRegistered(remoteName, remoteEntry);
      const Component = await loadRemoteModule(remoteName, normalizedModuleName);
      if (!Component) {
        throw new Error(`Remote module ${cacheKey} did not resolve to a component`);
      }
      return { default: Component };
    });
    remoteCache.set(cacheKey, LazyComponent);
  }

  const Component = remoteCache.get(cacheKey)!;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
};

function LoadingFallback() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
