import { BottomNavigation, type RouteConfig, type TabIcon } from '@vritti/quantum-ui-native/BottomNavigation';
import { clearRevalidatedSession } from '@vritti/quantum-ui-native/hooks';
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { apolloClient } from '../config/apollo';
import { resolveRemoteName } from '../config/remotes.config';
import { usePermissionContext } from '../providers/PermissionProvider';
import { AccountScreen } from '../screens/account/AccountScreen';
import { RemoteHeader } from './RemoteHeader';
import { RemoteScreen } from './RemoteScreen';

export const DynamicFeatureNavigator = () => {
  const { features, isLoadingBUs, isLoadingPermissions } = usePermissionContext();

  const routes = useMemo<RouteConfig[]>(
    () => [
      ...features.map((feature) => {
        // Server sends the per-OS mobile manifest URL via SSE (X-Platform header drives the pick).
        const remoteEntry = feature.route.remoteEntry;
        const remoteName = resolveRemoteName(remoteEntry);
        const moduleName = feature.route.exposedModule;
        return {
          name: feature.route.routePrefix,
          component: RemoteScreen,
          params: { remoteName, remoteEntry, moduleName },
          // Icon names arrive as plain strings from the API; cast to TabIcon since they're validated at write time and trusted at runtime.
          icon: {
            sfSymbol: feature.sfSymbol,
            materialSymbol: feature.materialSymbol,
          } as TabIcon,
          label: feature.name,
          options: {
            headerShown: true,
            header: () => <RemoteHeader remoteName={remoteName} remoteEntry={remoteEntry} moduleName={moduleName} />,
          },
        };
      }),
      {
        name: 'Account',
        component: AccountScreen,
        icon: {
          sfSymbol: 'person.crop.circle',
          materialSymbol: 'account_circle',
        },
        label: 'Account',
      },
    ],
    [features],
  );

  // On every tab/feature change the Apollo cache is reset so each feature starts fresh (no stale data
  // across tabs). `resetStore()` clears all normalized entities + connections AND refetches active queries
  // (`clearStore()` only empties — it does NOT refetch, so a still-mounted tab kept rendering its last
  // result with no API hit). `clearRevalidatedSession()` re-arms the once-per-session feeds. The tab bar
  // isn't on Apollo, so it never blanks. popToTopOnBlur (below) pops each tab to its root list on leave, so
  // a by-id cache-only detail (not refetched by resetStore) is never left stranded post-reset.
  const handleActiveTabChange = useCallback(() => {
    clearRevalidatedSession();
    void apolloClient.resetStore().catch(() => {});
  }, []);

  if (isLoadingBUs || isLoadingPermissions) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="large" />
      </View>
    );
  }

  // No BU key here. BottomNavigation rebuilds its own Tab.Navigator when the route set changes
  // (its internal route-keyed navigatorKey), and routes flow reactively from the lifted
  // PermissionProvider. A redundant outer remount churned react-native-screens and blanked tabs.
  return (
    <BottomNavigation
      routes={routes}
      onActiveTabChange={handleActiveTabChange}
      screenOptions={{ popToTopOnBlur: true }}
    />
  );
};
