import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { ScreenHeader } from '@vritti/quantum-ui-native/ScreenHeader';
import { CostCategoriesList } from './screens/CostCategoriesListScreen';
import type { CostCategoryRoute } from './types';

const screens: ReadonlyArray<PushScreenConfig<CostCategoryRoute>> = [
  {
    name: 'CostCategoriesList',
    component: CostCategoriesList,
    header: () => (
      <ScreenHeader
        title="Cost Categories"
        subtitle="Manage landed-cost components"
        searchable
        searchPlaceholder="Search cost categories"
        createLabel="Add cost category"
      />
    ),
  },
];

export default function CostCategoriesScreen() {
  return <PushNavigator<CostCategoryRoute> initialRoute="CostCategoriesList" screens={screens} />;
}
