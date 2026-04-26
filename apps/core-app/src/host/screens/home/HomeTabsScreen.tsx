import { DynamicFeatureNavigator } from '../../mf/DynamicFeatureNavigator';
import { PermissionProvider } from '../../providers/PermissionProvider';

export const HomeTabsScreen = () => (
  <PermissionProvider>
    <DynamicFeatureNavigator />
  </PermissionProvider>
);
