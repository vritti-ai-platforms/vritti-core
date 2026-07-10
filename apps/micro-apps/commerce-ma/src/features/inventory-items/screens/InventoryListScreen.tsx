import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { useDebouncedScreenSearch, useRegisterScreenCreateAction } from '@vritti/quantum-ui-native/ScreenContainer';
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
import { useCallback, useMemo } from 'react';
import { RefreshControl, View } from 'react-native';
import { useInventoryItemsFeed } from '../../../hooks/inventory-items';
import type { FilterCondition, SearchState, SortCondition } from '../../../types/inventory-items';
import { InventoryItemCard } from '../components/InventoryItemCard';
import type { InventoryNavigation } from '../types';

// Stable empty refs (filters/sort not exposed yet) — the feed key only varies by `search`.
const EMPTY_FILTERS: FilterCondition[] = [];
const EMPTY_SORT: SortCondition[] = [];

export function InventoryList() {
  const navigation = useNavigation() as unknown as InventoryNavigation;

  // The header (+) creates by navigating to the full create screen (no sheet on this list).
  useRegisterScreenCreateAction(useCallback(() => navigation.navigate('InventoryItemCreate'), [navigation]));

  // The search field lives in the ScreenHeader; its debounced + trimmed value arrives via
  // useDebouncedScreenSearch (a new search = a fresh p1 stream; keepPreviousData avoids a flash).
  const debounced = useDebouncedScreenSearch();
  const search = useMemo<SearchState | null>(
    () => (debounced.length > 0 ? { columnId: 'all', value: debounced } : null),
    [debounced],
  );

  const feed = useInventoryItemsFeed({ filters: EMPTY_FILTERS, search, sort: EMPTY_SORT });

  // `screenScroll` makes the FlashList the bounded scroller that drives the ScreenHeader collapse via
  // the ScreenContainer scroll registry — no ScrollView nesting, so onEndReached only fires near the
  // real bottom (and the list virtualizes).
  return (
    <FlashList
      screenScroll
      data={feed.items}
      isLoading={feed.isLoading}
      skeletonVariant="card"
      keyExtractor={(item) => item.id}
      onEndReached={() => {
        if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        feed.isFetchingNextPage ? (
          <View className="py-4">
            <Spinner />
          </View>
        ) : null
      }
      refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refresh()} />}
      contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 16, paddingBottom: 16 }}
      ItemSeparatorComponent={() => <View className="h-3" />}
      emptyText={
        feed.isError ? "Couldn't load items." : search ? 'No items match your search.' : 'No inventory items yet.'
      }
      renderItem={({ item }) => (
        <InventoryItemCard
          item={item}
          onPress={(selected) => navigation.navigate('InventoryItemDetail', { id: selected.id })}
        />
      )}
    />
  );
}
