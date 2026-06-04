import { BottomNavigation, type RouteConfig } from '@vritti/quantum-ui-native/BottomNavigation';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { resolveRemoteName } from '../config/remotes.config';
import { usePermissionContext } from '../providers/PermissionProvider';
import { AccountScreen } from '../screens/account/AccountScreen';
import { RemoteScreen } from './RemoteScreen';
import { getCommerceTabIcon } from './tabIcons';

// ---------------------------------------------------------------------------
// DynamicFeatureNavigator
//
// Builds bottom tab screens dynamically from the user's permission features.
// Each tab resolves the remote from permission metadata, then loads the
// exposed module through the runtime remote registry.
// Lives inside core-app's NavigationContainer and builds native tab screens dynamically.
// ---------------------------------------------------------------------------

export const DynamicFeatureNavigator = () => {
  const { features, isLoadingBUs, isLoadingPermissions } = usePermissionContext();

  const routes = useMemo<RouteConfig[]>(
    () => [
      ...features.map((feature) => ({
        name: feature.route.routePrefix,
        component: RemoteScreen,
        params: {
          remoteName: resolveRemoteName(feature.route.remoteEntry),
          remoteEntry: feature.route.remoteEntry,
          moduleName: feature.route.exposedModule,
        },
        icon: getCommerceTabIcon(feature.route.exposedModule),
        label: feature.name,
      })),
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
