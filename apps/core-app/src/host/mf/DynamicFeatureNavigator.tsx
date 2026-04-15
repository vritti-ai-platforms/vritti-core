import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { BottomNavigation, type RouteConfig } from '@vritti/quantum-ui-native/BottomNavigation';
import { usePermissionContext } from '../providers/PermissionProvider';
import { RemoteScreen } from './RemoteScreen';
import { Text } from '@vritti/quantum-ui-native/Typography';

// ---------------------------------------------------------------------------
// Map a feature's remoteEntry URL to the MF container name.
// ---------------------------------------------------------------------------

function getContainerName(_remoteEntry: string): string {
  // All commerce features come from the "commerce-ma" container.
  // Extend this when adding more native MF remotes.
  return 'commerce-ma';
}

// ---------------------------------------------------------------------------
// DynamicFeatureNavigator
//
// Builds bottom tab screens dynamically from the user's permission features.
// Each tab lazy-loads its screen from the MF remote via React.lazy(import()).
// Uses standalone={false} since it's embedded inside core-app's NavigationContainer.
// ---------------------------------------------------------------------------

export function DynamicFeatureNavigator() {
  const { features, isLoadingBUs, isLoadingPermissions } =
    usePermissionContext();

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
        <Text className="text-muted-foreground">
          No features assigned to this business unit.
        </Text>
      </View>
    );
  }

  const routes: RouteConfig[] = features.map((feature) => ({
    name: feature.route.routePrefix,
    component: () => (
      <RemoteScreen
        remoteName={getContainerName(feature.route.remoteEntry)}
        moduleName={feature.route.exposedModule}
      />
    ),
    icon: {},
    label: feature.name,
  }));

  return <BottomNavigation routes={routes} standalone={false} />;
}
