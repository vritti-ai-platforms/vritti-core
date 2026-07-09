import { BottomSheet, type BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { SectionHeader } from '@vritti/quantum-ui-native/Label';
import { ListItem } from '@vritti/quantum-ui-native/ListItem';
import { RadioGroup, type RadioOption } from '@vritti/quantum-ui-native/RadioGroup';
import { Text } from '@vritti/quantum-ui-native/Text';
import { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { usePermissionContext } from '../../../providers/PermissionProvider';

// Lets the user switch the active business unit; the switcher sheet only opens when there's more than one.
export const BusinessUnitSwitcher = () => {
  const { businessUnits, selectedBuId, selectBu } = usePermissionContext();
  const sheetRef = useRef<BottomSheetRef>(null);

  const options = useMemo<RadioOption[]>(
    () =>
      businessUnits.map((bu) => ({
        value: bu.id,
        label: bu.name,
        description: [bu.code, bu.timezone].filter(Boolean).join(' · ') || undefined,
      })),
    [businessUnits],
  );

  if (businessUnits.length === 0) return null;

  const selected = businessUnits.find((bu) => bu.id === selectedBuId);
  const canSwitch = businessUnits.length > 1;

  const handleSelect = (buId: string) => {
    selectBu(buId);
    sheetRef.current?.dismiss();
  };

  return (
    <View className="gap-3">
      <SectionHeader title="Workspace" />
      <View className="rounded-xl bg-card">
        <ListItem
          title="Business unit"
          description={selected?.name ?? 'Select a business unit'}
          trailing={
            selected ? <Text className="text-sm text-muted-foreground">{selected.currencyCode}</Text> : undefined
          }
          onPress={canSwitch ? () => sheetRef.current?.present() : undefined}
        />
      </View>

      {canSwitch ? (
        <BottomSheet ref={sheetRef} detents={['auto']}>
          <View className="gap-4 px-4 pb-8 pt-2">
            <Text className="px-1 text-base font-semibold text-foreground">Switch business unit</Text>
            <RadioGroup
              variant="card"
              options={options}
              value={selectedBuId ?? undefined}
              onValueChange={handleSelect}
            />
          </View>
        </BottomSheet>
      ) : null}
    </View>
  );
};
