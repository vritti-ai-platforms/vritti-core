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
  const { features, isLoadingSites, isLoadingPermissions } = usePermissionContext();

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

  if (isLoadingSites || isLoadingPermissions) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size="large" />
      </View>
    );
  }

  // No BU key here — BottomNavigation rebuilds its own Tab.Navigator on route-set change; a redundant outer remount churned react-native-screens and blanked tabs.
  return <BottomNavigation routes={routes} />;
};
