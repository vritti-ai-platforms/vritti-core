import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { ScreenHeader } from '@vritti/quantum-ui-native/ScreenHeader';
// Side-effect: registers this feature's Apollo cache policies (uomDimension by-id read redirect) at module eval.
import './cache';
import { UomDimensionDetail } from './screens/UomDimensionDetailScreen';
import { UomDimensionsList } from './screens/UomDimensionsListScreen';
import type { UomRoute } from './types';

const screens: ReadonlyArray<PushScreenConfig<UomRoute>> = [
  {
    name: 'UomDimensionsList',
    component: UomDimensionsList,
    header: () => (
      <ScreenHeader
        title="Units of Measure"
        subtitle="Manage measurement dimensions"
        searchable
        searchPlaceholder="Search dimensions"
        createLabel="Add dimension"
      />
    ),
  },
  {
    name: 'UomDimensionDetail',
    component: UomDimensionDetail,
    headerShown: true,
    title: 'Dimension',
  },
];

export default function UomScreen() {
  return <PushNavigator<UomRoute> initialRoute="UomDimensionsList" screens={screens} />;
}
