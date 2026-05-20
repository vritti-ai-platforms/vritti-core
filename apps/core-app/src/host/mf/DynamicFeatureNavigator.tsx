import { BottomNavigation, type RouteConfig } from '@vritti/quantum-ui-native/BottomNavigation';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { getRemoteConfig, resolveRemoteName } from '../config/remotes.config';
import { usePermissionContext } from '../providers/PermissionProvider';
import { AccountScreen } from '../screens/account/AccountScreen';
import { RemoteHeader } from './RemoteHeader';
import { RemoteScreen } from './RemoteScreen';
import { getCommerceTabIcon } from './tabIcons';

export const DynamicFeatureNavigator = () => {
  const { features, isLoadingBUs, isLoadingPermissions } = usePermissionContext();

  const routes = useMemo<RouteConfig[]>(
    () => [
      ...features.map((feature) => {
        const remoteName = resolveRemoteName(feature.route.remoteEntry);
        // Native host resolves remote URLs from its own config — the API's remoteEntry targets web MF ports
        const remoteEntry = getRemoteConfig(remoteName)?.entry ?? feature.route.remoteEntry;
        const moduleName = feature.route.exposedModule;
        return {
          name: feature.route.routePrefix,
          component: RemoteScreen,
          params: { remoteName, remoteEntry, moduleName },
          icon: getCommerceTabIcon(moduleName),
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
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <BottomNavigation routes={routes} />;
};
