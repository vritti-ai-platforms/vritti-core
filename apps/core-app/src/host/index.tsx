import { Script, ScriptManager } from '@callstack/repack/client';
import { lazy, Suspense } from 'react';
import { AppRegistry } from 'react-native';
import { getRemoteAssetBase, getRemoteConfigByRuntimeName } from './config/remotes.config';

// Resolve host-local split chunks from the host dev server/filesystem and remote
// containers/chunks from the registered remote asset base.
ScriptManager.shared.addResolver(async (scriptId, caller) => {
  const remoteContainer = getRemoteConfigByRuntimeName(scriptId);
  if (remoteContainer) {
    return {
      url: `${getRemoteAssetBase(remoteContainer)}${remoteContainer.containerFilename}`,
      cache: false,
    };
  }

  const remoteCaller = getRemoteConfigByRuntimeName(caller);
  if (remoteCaller) {
    return {
      url: `${getRemoteAssetBase(remoteCaller)}${scriptId}.chunk.bundle`,
      cache: false,
    };
  }

  if (caller === 'main' || caller === 'vritti_core_app' || !caller) {
    if (__DEV__) {
      return { url: Script.getDevServerURL(scriptId), cache: false };
    }
    return { url: Script.getFileSystemURL(scriptId) };
  }
  return undefined;
});

// Async boundary — MF shared scope initializes before bootstrap runs.
// Only react + react-native (eager:true) are used above this line.
const LazyApp = lazy(() => import('./bootstrap'));

function Root() {
  return (
    <Suspense fallback={null}>
      <LazyApp />
    </Suspense>
  );
}

AppRegistry.registerComponent('coreapp', () => Root);
