import { Button } from '@vritti/quantum-ui-native/Button';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { ScreenHeader } from '@vritti/quantum-ui-native/ScreenHeader';
import { TaxGroupsList } from './screens/TaxGroupsListScreen';
import { TaxGroupCreateProvider, useTaxGroupCreate } from './TaxGroupCreateContext';
import type { TaxGroupRoute } from './types';

const PLUS_ICON = { sfSymbol: 'plus', materialSymbol: 'add' } as const;

// Header action — opens the create sheet the list screen owns (via TaxGroupCreateContext).
function CreateButton() {
  const { requestCreate } = useTaxGroupCreate();
  return (
    <Button variant="glass" size="icon" onPress={requestCreate} accessibilityLabel="Add tax group" hitSlop={8}>
      <DynamicIcon icon={PLUS_ICON} size={24} />
    </Button>
  );
}

const screens: ReadonlyArray<PushScreenConfig<TaxGroupRoute>> = [
  {
    name: 'TaxGroupsList',
    component: TaxGroupsList,
    header: () => (
      <ScreenHeader
        title="Tax Groups"
        subtitle="Manage tax rates"
        searchable
        searchPlaceholder="Search tax groups"
        rightActions={<CreateButton />}
      />
    ),
  },
];

export default function TaxGroupsScreen() {
  return (
    <TaxGroupCreateProvider>
      <PushNavigator<TaxGroupRoute> initialRoute="TaxGroupsList" screens={screens} />
    </TaxGroupCreateProvider>
  );
}
