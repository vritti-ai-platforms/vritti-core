import { BottomNavigation, type RouteConfig } from '@vritti/quantum-ui-native/BottomNavigation';
import { Text } from '@vritti/quantum-ui-native/Typography';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { resolveRemoteName } from '../config/remotes.config';
import { usePermissionContext } from '../providers/PermissionProvider';
import { RemoteScreen } from './RemoteScreen';
import { getCommerceTabIcon } from './tabIcons';

// ---------------------------------------------------------------------------
// DynamicFeatureNavigator
//
// Builds bottom tab screens dynamically from the user's permission features.
// Each tab resolves the remote from permission metadata, then loads the
// exposed module through the runtime remote registry.
// Uses standalone={false} since it's embedded inside core-app's NavigationContainer.
// ---------------------------------------------------------------------------

export function DynamicFeatureNavigator() {
  const { features, isLoadingBUs, isLoadingPermissions } = usePermissionContext();

  const routes = useMemo<RouteConfig[]>(
    () =>
      features.map((feature) => ({
        name: feature.route.routePrefix,
        render: () => (
          <RemoteScreen
            remoteName={resolveRemoteName(feature.route.remoteEntry)}
            remoteEntry={feature.route.remoteEntry}
            moduleName={feature.route.exposedModule}
          />
        ),
        icon: getCommerceTabIcon(feature.route.exposedModule),
        label: feature.name,
      })),
    [features],
  );

  if (isLoadingBUs || isLoadingPermissions) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (features.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text className="text-muted-foreground">No features assigned to this business unit.</Text>
      </View>
    );
  }

  return <BottomNavigation routes={routes} standalone={false} />;
}
