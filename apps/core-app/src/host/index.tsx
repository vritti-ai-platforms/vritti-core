import '../../global.css';
import { lazy, Suspense } from 'react';
import { AppRegistry, View } from 'react-native';
import { ScriptManager, Script } from '@callstack/repack/client';

// Resolve local split chunks (bootstrap, vendors).
// Remote MF containers are handled by V2 resolver-plugin automatically.
ScriptManager.shared.addResolver(async (scriptId, caller) => {
  if (!caller || caller === 'main' || caller === 'vritti_core_app') {
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
    <Suspense fallback={<View style={{ flex: 1 }} />}>
      <LazyApp />
    </Suspense>
  );
}

AppRegistry.registerComponent('coreapp', () => Root);
