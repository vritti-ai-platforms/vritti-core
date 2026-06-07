import { loadRemote, registerRemotes } from '@module-federation/enhanced/runtime';
import type { RouteProp } from '@react-navigation/native';
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
import React, { Suspense, useMemo } from 'react';
import { View } from 'react-native';
import { getRemoteConfig } from '../config/remotes.config';
import { RemoteErrorBoundary } from './RemoteErrorBoundary';

const registeredRemotes = new Map<string, string>();
export type RemoteModule = {
  default: React.ComponentType;
  Header?: React.ComponentType;
};

const modulePromiseCache = new Map<string, Promise<RemoteModule>>();

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

export function getRemoteModule(
  remoteName: string,
  remoteEntry: string | undefined,
  moduleName: string,
): Promise<RemoteModule> {
  const normalized = moduleName.startsWith('./') ? moduleName : `./${moduleName}`;
  const key = `${remoteName}|${remoteEntry ?? 'default'}|${normalized}`;
  const cached = modulePromiseCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    ensureRemoteRegistered(remoteName, remoteEntry);
    try {
      const mod = await loadRemote(`${remoteName}/${normalized.replace(/^\.\//, '')}`);
      const m = mod as RemoteModule | undefined;
      if (!m?.default) {
        const received = m ? Object.keys(m).join(', ') || '(no keys)' : 'undefined';
        throw new Error(`Remote module ${remoteName}/${normalized} has no default export (received: ${received})`);
      }
      return m;
    } catch (err) {
      console.error('[RemoteScreen] load failed', {
        remoteName,
        remoteEntry,
        moduleName: normalized,
        error: err instanceof Error ? err.message : err,
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw err;
    }
  })();

  // A rejected load must not stay cached — a stale rejection would replay on every retry
  promise.catch(() => modulePromiseCache.delete(key));
  modulePromiseCache.set(key, promise);
  return promise;
}

export const RemoteScreen = ({ route }: RemoteScreenProps) => {
  const { remoteName, moduleName, remoteEntry } = route.params;

  const ScreenComponent = useMemo(
    () =>
      React.lazy(async () => ({
        default: (await getRemoteModule(remoteName, remoteEntry, moduleName)).default,
      })),
    [remoteName, remoteEntry, moduleName],
  );

  return (
    <RemoteErrorBoundary remoteName={remoteName} moduleName={moduleName}>
      <Suspense fallback={<LoadingFallback />}>
        <ScreenComponent />
      </Suspense>
    </RemoteErrorBoundary>
  );
};

function LoadingFallback() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Spinner size="large" />
    </View>
  );
}
