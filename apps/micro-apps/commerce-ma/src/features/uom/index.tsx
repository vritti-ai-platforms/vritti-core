import { type RouteProp, useNavigation } from '@react-navigation/native';
import { BottomSheet, type BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { Button } from '@vritti/quantum-ui-native/Button';
import { Checkbox } from '@vritti/quantum-ui-native/Checkbox';
import { DynamicIcon } from '@vritti/quantum-ui-native/DynamicIcon';
import { PushNavigator, type PushScreenConfig } from '@vritti/quantum-ui-native/PushNavigator';
import { RadioGroup } from '@vritti/quantum-ui-native/RadioGroup';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { ScreenHeader } from '@vritti/quantum-ui-native/ScreenHeader';
import { Select, type SelectOption, type SelectValue } from '@vritti/quantum-ui-native/Select';
import { TextField } from '@vritti/quantum-ui-native/TextField';
import { Text } from '@vritti/quantum-ui-native/Text';
import { useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

type UOMRoute = 'UOMList' | 'UOMDetail';

interface UOMDetailParams {
  id: number;
}

function UOMList() {
  const navigation = useNavigation() as unknown as {
    navigate: (screen: 'UOMDetail', params: UOMDetailParams) => void;
  };

  return (
    <ScreenContainer scrollable>
      <View className="gap-3 p-4">
        {Array.from({ length: 30 }).map((_, i) => {
          const id = i + 1;
          return (
            <Pressable
              key={`uom-${id}`}
              onPress={() => navigation.navigate('UOMDetail', { id })}
              android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
              className="bg-card border border-border rounded-xl p-4"
            >
              <Text className="text-base font-semibold text-foreground">UOM #{id}</Text>
              <Text className="text-sm text-muted-foreground">Placeholder row {id}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const UOM_TYPE_OPTIONS: SelectOption[] = [
  { value: 'weight', label: 'Weight', description: 'kg, g, lb, oz' },
  { value: 'volume', label: 'Volume', description: 'L, mL, gal' },
  { value: 'length', label: 'Length', description: 'm, cm, ft, in' },
  { value: 'count', label: 'Count', description: 'pcs, dozen, box' },
  { value: 'area', label: 'Area', description: 'm², ft²' },
  { value: 'temperature', label: 'Temperature', description: '°C, °F (coming soon)', disabled: true },
];

// Async options load from this endpoint, which must return { options: [{ value, label }], hasMore }
const BOM_ENDPOINT = 'commerce-api/bom/select';

// Demonstrates Checkbox + single/multi Select (static and async) from quantum-ui-native
function SelectCheckboxExamples() {
  const [active, setActive] = useState(true);
  const [allowDecimals, setAllowDecimals] = useState(false);
  const [singleType, setSingleType] = useState<SelectValue | undefined>('weight');
  const [multiTypes, setMultiTypes] = useState<SelectValue[]>(['weight', 'count']);
  const [singleBom, setSingleBom] = useState<SelectValue | undefined>(undefined);
  const [multiBom, setMultiBom] = useState<SelectValue[]>([]);
  const [unitName, setUnitName] = useState('');
  const [system, setSystem] = useState('metric');
  const [rounding, setRounding] = useState('nearest');

  return (
    <View className="gap-5">
      <Text className="text-base font-semibold text-foreground">Select, Checkbox & Radio examples</Text>

      <TextField
        label="Name"
        placeholder="e.g. Kilogram"
        value={unitName}
        onChangeText={setUnitName}
        autoCapitalize="words"
      />

      <View className="gap-3">
        <Checkbox label="Active" checked={active} onCheckedChange={setActive} />
        <Checkbox label="Allow decimal quantities" checked={allowDecimals} onCheckedChange={setAllowDecimals} />
        <Checkbox label="System unit (locked)" checked disabled onCheckedChange={() => {}} />
      </View>



      <Select
        multiple
        label="Compatible types"
        placeholder="Select types"
        options={UOM_TYPE_OPTIONS}
        value={multiTypes}
        onChange={(values: SelectValue[]) => setMultiTypes(values)}
        searchable
      />

      <Select
        label="Measurement type"
        placeholder="Select a type"
        options={UOM_TYPE_OPTIONS}
        value={singleType}
        onChange={(value: SelectValue) => setSingleType(value)}
        searchable
        clearable
      />

      <RadioGroup
        label="Measurement system"
        value={system}
        onValueChange={setSystem}
        options={[
          { value: 'metric', label: 'Metric', description: 'kg, m, L' },
          { value: 'imperial', label: 'Imperial', description: 'lb, ft, gal' },
        ]}
      />

      <RadioGroup
        label="Rounding"
        variant="card"
        value={rounding}
        onValueChange={setRounding}
        options={[
          { value: 'nearest', label: 'Nearest', description: 'Round to the nearest whole unit' },
          { value: 'up', label: 'Round up', description: 'Always round up' },
          { value: 'down', label: 'Round down', description: 'Always round down' },
        ]}
      />

      {/* <Select
        label="Bill of materials"
        placeholder="Search BOM…"
        optionsEndpoint={BOM_ENDPOINT}
        value={singleBom}
        onChange={(value: SelectValue) => setSingleBom(value)}
        clearable
      />

      <Select
        multiple
        label="Linked BOMs"
        placeholder="Search BOMs…"
        optionsEndpoint={BOM_ENDPOINT}
        value={multiBom}
        onChange={(values: SelectValue[]) => setMultiBom(values)}
      /> */}
    </View>
  );
}

function UOMDetail({ route }: { route: RouteProp<{ UOMDetail: UOMDetailParams }, 'UOMDetail'> }) {
  const id = route.params?.id ?? '?';
  const fullSheetRef = useRef<BottomSheetRef>(null);
  const halfSheetRef = useRef<BottomSheetRef>(null);

  return (
    <ScreenContainer scrollable>
      <View className="p-4 gap-4">
        <Text className="text-2xl font-bold text-foreground">UOM #{id}</Text>
        <Text className="text-base text-muted-foreground">
          Pushed via PushNavigator from the UOM list. Use the back button or swipe right to return.
        </Text>

        <View className="bg-card border border-border rounded-xl p-4 gap-3">
          <View>
            <Text className="text-xs uppercase text-muted-foreground">ID</Text>
            <Text className="text-base font-semibold text-foreground">{id}</Text>
          </View>
          <View>
            <Text className="text-xs uppercase text-muted-foreground">Name</Text>
            <Text className="text-base font-semibold text-foreground">Unit #{id}</Text>
          </View>
          <View>
            <Text className="text-xs uppercase text-muted-foreground">Type</Text>
            <Text className="text-base font-semibold text-foreground">Placeholder</Text>
          </View>
        </View>

        <SelectCheckboxExamples />

        <View className="gap-3">
          <Text className="text-base font-semibold text-foreground">Bottom sheet examples</Text>
          <Button onPress={() => fullSheetRef.current?.present()}>
            <Text>Open full sheet</Text>
          </Button>
          <Button variant="ghost" onPress={() => halfSheetRef.current?.present()}>
            <Text>Open half sheet</Text>
          </Button>
        </View>
      </View>

      <BottomSheet
        ref={fullSheetRef}
        detents={['full']}
        title="Full sheet"
        onClose={() => fullSheetRef.current?.dismiss()}
      >
        <View className="gap-3 px-4">
          <Text className="text-base font-semibold text-foreground">Full-height sheet</Text>
          <Text className="text-sm text-muted-foreground">
            Opens to the full screen height with a scrollable body. Tap Close or drag down to dismiss.
          </Text>
          {Array.from({ length: 30 }).map((_, i) => {
            const row = i + 1;
            return (
              <View key={`full-row-${row}`} className="bg-card border border-border rounded-xl p-4">
                <Text className="text-sm font-semibold text-foreground">Row {row}</Text>
                <Text className="text-xs text-muted-foreground">Placeholder content</Text>
              </View>
            );
          })}
        </View>
      </BottomSheet>

      <BottomSheet ref={halfSheetRef} detents={['80%']}>
        <View className="gap-3 px-4 pb-8 pt-2">
        <TextField
        label="Name"
        placeholder="e.g. Kilogram"
        value={''}
        autoCapitalize="words"
      />
          <Text className="text-base font-semibold text-foreground">Half-height sheet</Text>
          <Text className="text-sm text-muted-foreground">
            Opens to roughly half the screen height. Drag the grabber up to expand or down to dismiss.
          </Text>
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
}

const CREATE_ICON = { sfSymbol: 'plus', materialIcon: 'add' } as const;

function CreateButton() {
  // onPress is a placeholder — the create flow is not wired up yet.
  return (
    <Button variant="glass" size="icon" onPress={() => {}} accessibilityLabel="Create" hitSlop={8}>
      <DynamicIcon icon={CREATE_ICON} size={24} />
    </Button>
  );
}

const FILTER_ICON = { sfSymbol: 'line.3.horizontal.decrease', materialIcon: 'filter-list' } as const;

function FilterButton() {
  // onPress is a placeholder — filtering/sorting is not wired up yet.
  return (
    <Button variant="glass" size="icon" onPress={() => {}} accessibilityLabel="Filter" hitSlop={8}>
      <DynamicIcon icon={FILTER_ICON} size={24} />
    </Button>
  );
}

const screens: ReadonlyArray<PushScreenConfig<UOMRoute>> = [
  {
    name: 'UOMList',
    component: UOMList,
    header: () => (
      <ScreenHeader
        title="Units of Measure"
        // leftActions={<FilterButton />}
        rightActions={<CreateButton />}
      />
    ),
  },
  { name: 'UOMDetail', component: UOMDetail, headerShown: true, title: 'UOM Detail' },
];

export default function UOMScreen() {
  return <PushNavigator<UOMRoute> initialRoute="UOMList" screens={screens} />;
}
