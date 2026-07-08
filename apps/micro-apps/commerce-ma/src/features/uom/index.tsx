import { Button } from '@vritti/quantum-ui-native/Button';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { ScreenHeader } from '@vritti/quantum-ui-native/ScreenHeader';
// Side-effect: registers this feature's Apollo cache policies (uomDimension by-id read redirect) at module eval.
import './cache';
import { UomDimensionDetail } from './screens/UomDimensionDetailScreen';
import { UomDimensionsList } from './screens/UomDimensionsListScreen';
import type { UomRoute } from './types';
import { UomCreateProvider, useUomCreate } from './UomCreateContext';

const PLUS_ICON = { sfSymbol: 'plus', materialSymbol: 'add' } as const;

// Header action — opens the create sheet the list screen owns (via UomCreateContext).
function CreateButton() {
  const { requestCreate } = useUomCreate();
  return (
    <Button variant="glass" size="icon" onPress={requestCreate} accessibilityLabel="Add dimension" hitSlop={8}>
      <DynamicIcon icon={PLUS_ICON} size={24} />
    </Button>
  );
}

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
        rightActions={<CreateButton />}
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
  return (
    <UomCreateProvider>
      <PushNavigator<UomRoute> initialRoute="UomDimensionsList" screens={screens} />
    </UomCreateProvider>
  );
}
