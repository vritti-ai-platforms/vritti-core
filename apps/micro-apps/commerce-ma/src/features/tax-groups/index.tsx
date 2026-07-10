import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { ScreenHeader } from '@vritti/quantum-ui-native/ScreenHeader';
import { TaxGroupsList } from './screens/TaxGroupsListScreen';
import type { TaxGroupRoute } from './types';

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
        createLabel="Add tax group"
      />
    ),
  },
];

export default function TaxGroupsScreen() {
  return <PushNavigator<TaxGroupRoute> initialRoute="TaxGroupsList" screens={screens} />;
}
