import { BottomNavigation, type RouteConfig, type TabIcon } from '@vritti/quantum-ui-native/BottomNavigation';
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
import { useMemo } from 'react';
import { View } from 'react-native';
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
          // Icon names arrive as plain strings from the API; cast to the strict TabIcon unions since
          // the values are validated at write time in the cloud admin and trusted at runtime.
          icon: {
            sfSymbol: feature.sfSymbol,
            materialSymbol: feature.materialSymbol,
            materialIcon: feature.materialSymbol.replace(/_/g, '-'),
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
  return <BottomNavigation routes={routes} />;
};
