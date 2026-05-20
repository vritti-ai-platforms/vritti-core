import React, { Suspense, useMemo } from 'react';
import { getRemoteModule, type RemoteScreenParams } from './RemoteScreen';

export type RemoteHeaderProps = RemoteScreenParams;

export const RemoteHeader = ({ remoteName, remoteEntry, moduleName }: RemoteHeaderProps) => {
  const HeaderComponent = useMemo(
    () =>
      React.lazy(async () => {
        try {
          const mod = await getRemoteModule(remoteName, remoteEntry, moduleName);
          return { default: mod.Header ?? (() => null) };
        } catch (err) {
          console.error('[RemoteHeader] load failed', {
            remoteName,
            moduleName,
            error: err instanceof Error ? err.message : err,
          });
          return { default: () => null };
        }
      }),
    [remoteName, remoteEntry, moduleName],
  );

  return (
    <Suspense fallback={null}>
      <HeaderComponent />
    </Suspense>
  );
};
