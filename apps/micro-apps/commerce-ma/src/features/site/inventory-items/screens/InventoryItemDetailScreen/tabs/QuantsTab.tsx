import type { BottomSheetRef } from '@vritti/quantum-ui-native/BottomSheet';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
import { useCallback, useRef, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useQuantsFeed } from '../../../../../../hooks/site/quants';
import type { InventoryItem } from '../../../../../../types/inventory-items';
import type { Quant } from '../../../../../../types/quants';
import { QuantCard } from '../../../components/QuantCard';
import { QuantDetailSheet } from '../../../components/QuantDetailSheet';

// Read-only per-quant feed with Relay infinite scroll. The card's view button opens a detail bottom sheet.
export function QuantsTab({ item }: { item: InventoryItem }) {
  const feed = useQuantsFeed(item.id);
  const sheetRef = useRef<BottomSheetRef>(null);
  const [viewing, setViewing] = useState<Quant | null>(null);

  const handleView = useCallback((quant: Quant) => {
    setViewing(quant);
    sheetRef.current?.present();
  }, []);

  return (
    <View className="flex-1">
      <FlashList
        screenScroll
        data={feed.items}
        isLoading={feed.isLoading}
        skeletonVariant="card"
        keyExtractor={(quant) => quant.id}
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
        emptyText={feed.isError ? "Couldn't load quants." : 'No stock segments yet.'}
        renderItem={({ item: quant }) => <QuantCard quant={quant} uomSymbol={item.uomSymbol} onView={handleView} />}
      />
      <QuantDetailSheet ref={sheetRef} quant={viewing} uomSymbol={item.uomSymbol} />
    </View>
  );
}
