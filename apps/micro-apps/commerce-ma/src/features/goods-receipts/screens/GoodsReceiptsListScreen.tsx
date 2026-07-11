import { useNavigation } from '@react-navigation/native';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { useDebouncedScreenSearch } from '@vritti/quantum-ui-native/ScreenContainer';
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
import { useMemo } from 'react';
import { RefreshControl, View } from 'react-native';
import { useGoodsReceiptsFeed } from '../../../hooks/goods-receipts';
import type { SearchState } from '../../../types/inventory-items';
import { GoodsReceiptCard } from '../components/GoodsReceiptCard';
import type { GoodsReceiptNavigation } from '../types';

// Goods receipts list — infinite keyset feed of GR cards (tap → detail). Search (GR #/supplier/PO) lives in
// the ScreenHeader and arrives debounced; read-only (GR creation is a PO-linked flow not on mobile).
export function GoodsReceiptsList() {
  const navigation = useNavigation() as unknown as GoodsReceiptNavigation;

  const debounced = useDebouncedScreenSearch();
  const search = useMemo<SearchState | null>(
    () => (debounced.length > 0 ? { columnId: 'all', value: debounced } : null),
    [debounced],
  );

  const feed = useGoodsReceiptsFeed({ search });

  return (
    <FlashList
      screenScroll
      data={feed.items}
      isLoading={feed.isLoading}
      skeletonVariant="card"
      keyExtractor={(gr) => gr.id}
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
      contentContainerStyle={{ padding: 16 }}
      ItemSeparatorComponent={() => <View className="h-3" />}
      emptyText={
        feed.isError
          ? "Couldn't load goods receipts."
          : search
            ? 'No goods receipts match your search.'
            : 'No goods receipts yet.'
      }
      renderItem={({ item }) => (
        <GoodsReceiptCard gr={item} onPress={(gr) => navigation.navigate('GoodsReceiptDetail', { id: gr.id })} />
      )}
    />
  );
}
