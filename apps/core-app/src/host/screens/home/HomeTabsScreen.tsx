import { ScreenLayout } from '@vritti/quantum-ui-native';
import { DynamicFeatureNavigator } from '../../mf/DynamicFeatureNavigator';
import { PermissionProvider } from '../../providers/PermissionProvider';

export const HomeTabsScreen = () => (
  <ScreenLayout>
    <PermissionProvider>
      <DynamicFeatureNavigator />
    </PermissionProvider>
  </ScreenLayout>
);
