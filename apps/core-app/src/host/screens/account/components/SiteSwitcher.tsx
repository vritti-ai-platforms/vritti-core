import { BottomSheet, type BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { SectionHeader } from '@vritti/quantum-ui-native/Label';
import { ListItem } from '@vritti/quantum-ui-native/ListItem';
import { RadioGroup, type RadioOption } from '@vritti/quantum-ui-native/RadioGroup';
import { Text } from '@vritti/quantum-ui-native/Text';
import { useMemo, useRef } from 'react';
import { View } from 'react-native';
import { usePermissionContext } from '../../../providers/PermissionProvider';

// Lets the user switch the active site; the switcher sheet only opens when there's more than one.
export const SiteSwitcher = () => {
  const { sites, selectedSiteId, selectSite } = usePermissionContext();
  const sheetRef = useRef<BottomSheetRef>(null);

  const options = useMemo<RadioOption[]>(
    () =>
      sites.map((site) => ({
        value: site.id,
        label: site.name,
        description: [site.code, site.timezone].filter(Boolean).join(' · ') || undefined,
      })),
    [sites],
  );

  if (sites.length === 0) return null;

  const selected = sites.find((site) => site.id === selectedSiteId);
  const canSwitch = sites.length > 1;

  const handleSelect = (siteId: string) => {
    selectSite(siteId);
    sheetRef.current?.dismiss();
  };

  return (
    <View className="gap-3">
      <SectionHeader title="Workspace" />
      <View className="rounded-xl bg-card">
        <ListItem
          title="Site"
          description={selected?.name ?? 'Select a site'}
          trailing={
            selected ? <Text className="text-sm text-muted-foreground">{selected.currencyCode}</Text> : undefined
          }
          onPress={canSwitch ? () => sheetRef.current?.present() : undefined}
        />
      </View>

      {canSwitch ? (
        <BottomSheet ref={sheetRef} detents={['auto']}>
          <View className="gap-4 px-4 pb-8 pt-2">
            <Text className="px-1 text-base font-semibold text-foreground">Switch site</Text>
            <RadioGroup
              variant="card"
              options={options}
              value={selectedSiteId ?? undefined}
              onValueChange={handleSelect}
            />
          </View>
        </BottomSheet>
      ) : null}
    </View>
  );
};
