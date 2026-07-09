import { Button } from '@vritti/quantum-ui-native/Button';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { ScreenHeader } from '@vritti/quantum-ui-native/ScreenHeader';
import { CostCategoryCreateProvider, useCostCategoryCreate } from './CostCategoryCreateContext';
import { CostCategoriesList } from './screens/CostCategoriesListScreen';
import type { CostCategoryRoute } from './types';

const PLUS_ICON = { sfSymbol: 'plus', materialSymbol: 'add' } as const;

// Header action — opens the create sheet the list screen owns (via CostCategoryCreateContext).
function CreateButton() {
  const { requestCreate } = useCostCategoryCreate();
  return (
    <Button variant="glass" size="icon" onPress={requestCreate} accessibilityLabel="Add cost category" hitSlop={8}>
      <DynamicIcon icon={PLUS_ICON} size={24} />
    </Button>
  );
}

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
        rightActions={<CreateButton />}
      />
    ),
  },
];

export default function CostCategoriesScreen() {
  return (
    <CostCategoryCreateProvider>
      <PushNavigator<CostCategoryRoute> initialRoute="CostCategoriesList" screens={screens} />
    </CostCategoryCreateProvider>
  );
}
