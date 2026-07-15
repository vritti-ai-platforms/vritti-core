import { NetworkStatus } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { useCreateEditSheet } from '@vritti/quantum-ui-native/hooks';
import { useDebouncedScreenSearch } from '@vritti/quantum-ui-native/ScreenContainer';
import { RefreshControl, View } from 'react-native';
import { useUomDimensions } from '../../../../hooks/site/uom-dimensions';
import type { UomDimension } from '../../../../types/uom-dimensions';
import { UomDimensionCard } from '../components/UomDimensionCard';
import { UomDimensionFormSheet } from '../forms/UomDimensionFormSheet';
import type { UomNavigation } from '../types';

// UOM dimensions list — plain tappable rows (tap → detail, where edit/delete live). The header create (+)
// button opens the create sheet owned here. Search lives in the ScreenHeader.
export function UomDimensionsList() {
  const navigation = useNavigation() as unknown as UomNavigation;

  const debounced = useDebouncedScreenSearch();

  const { data, previousData, loading, refetch, networkStatus } = useUomDimensions(debounced);
  // Keep the last good list visible while a new search / refetch is in flight (no flash).
  const dimensions = ((data ?? previousData)?.uomDimensions ?? []) as UomDimension[];

  // Create-only sheet, opened by the header (+) via the registry (edit lives on the detail screen).
  const { sheetRef } = useCreateEditSheet<UomDimension>({ registerCreateAction: true });

  return (
    <View className="flex-1">
      <FlashList
        screenScroll
        data={dimensions}
        isLoading={loading}
        skeletonVariant="card"
        keyExtractor={(dimension) => dimension.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        refreshControl={
          <RefreshControl refreshing={networkStatus === NetworkStatus.refetch} onRefresh={() => refetch()} />
        }
        emptyText={debounced ? 'No dimensions match your search.' : 'No dimensions yet.'}
        renderItem={({ item: dimension }) => (
          <UomDimensionCard
            dimension={dimension}
            onPress={(selected) => navigation.navigate('UomDimensionDetail', { id: selected.id })}
          />
        )}
      />
      <UomDimensionFormSheet ref={sheetRef} editing={null} />
    </View>
  );
}
