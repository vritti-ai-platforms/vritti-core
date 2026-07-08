import { NetworkStatus } from '@apollo/client';
import { useNavigation } from '@react-navigation/native';
import type { BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { useScreenSearch } from '@vritti/quantum-ui-native/ScreenContainer';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useUomDimensions } from '../../../hooks/uom-dimensions';
import type { UomDimension } from '../../../types/uom-dimensions';
import { UomDimensionCard } from '../components/UomDimensionCard';
import { UomDimensionFormSheet } from '../forms/UomDimensionFormSheet';
import type { UomNavigation } from '../types';
import { useUomCreate } from '../UomCreateContext';

const SEARCH_DEBOUNCE_MS = 300;

// UOM dimensions list — plain tappable rows (tap → detail, where edit/delete live). The header create
// button (via UomCreateContext) opens the create sheet owned here. Search lives in the ScreenHeader.
export function UomDimensionsList() {
  const navigation = useNavigation() as unknown as UomNavigation;

  const { query } = useScreenSearch();
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);

  const { data, previousData, loading, refetch, networkStatus } = useUomDimensions(debounced);
  // Keep the last good list visible while a new search / refetch is in flight (no flash).
  const dimensions = ((data ?? previousData)?.uomDimensions ?? []) as UomDimension[];

  // Create-only sheet, opened by the header button (edit lives on the detail screen).
  const sheetRef = useRef<BottomSheetRef>(null);
  const openCreate = useCallback(() => {
    sheetRef.current?.present();
  }, []);
  const { setCreateHandler } = useUomCreate();
  useEffect(() => {
    setCreateHandler(openCreate);
    return () => setCreateHandler(null);
  }, [openCreate, setCreateHandler]);

  // Skeletons only on the very first load (no cached/previous data) — a search refetch keeps content on screen.
  const isInitialLoading = loading && networkStatus === NetworkStatus.loading && dimensions.length === 0;

  return (
    <View className="flex-1">
      <FlashList
        screenScroll
        data={dimensions}
        isLoading={isInitialLoading}
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
