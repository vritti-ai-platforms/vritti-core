import { DynamicFeatureNavigator } from '../../mf/DynamicFeatureNavigator';

// PermissionProvider now wraps the whole authenticated stack in AppRender (so a BU switch
// can remount the entire navigator), so this screen just renders the feature navigator.
export const HomeTabsScreen = () => <DynamicFeatureNavigator />;
