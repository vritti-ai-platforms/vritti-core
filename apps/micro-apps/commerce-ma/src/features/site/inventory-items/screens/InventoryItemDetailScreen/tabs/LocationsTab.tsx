import { Fab } from '@vritti/quantum-ui-native/Fab';
import { FlashList } from '@vritti/quantum-ui-native/FlashList';
import { useConfirm, useCreateEditSheet } from '@vritti/quantum-ui-native/hooks';
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
import { RefreshControl, View } from 'react-native';
import { useDeleteItemLocation, useItemLocationsFeed } from '../../../../../../hooks/site/item-locations';
import type { InventoryItem } from '../../../../../../types/inventory-items';
import type { ItemLocation } from '../../../../../../types/item-locations';
import { ItemLocationCard } from '../../../components/ItemLocationCard';
import { ItemLocationFormSheet } from '../../../forms/ItemLocationFormSheet';

// Locations tab — per-item location configs (reorder thresholds) with Relay infinite scroll. The FAB opens a
// bottom sheet to add one, a card's edit opens it prefilled, delete is confirm-first.
export function LocationsTab({ item }: { item: InventoryItem }) {
  const feed = useItemLocationsFeed(item.id);
  const [deleteLocation] = useDeleteItemLocation();
  const confirm = useConfirm();

  const { sheetRef, editing, openCreate, openEdit } = useCreateEditSheet<ItemLocation>();

  const handleDelete = async (location: ItemLocation) => {
    const confirmed = await confirm({
      title: 'Remove location?',
      description: `Remove the minimum stock level for ${location.locationName ?? 'this location'}. This can't be undone.`,
      confirmLabel: 'Remove',
      variant: 'destructive',
    });
    if (confirmed) deleteLocation({ variables: { id: location.id } });
  };

  return (
    <View className="flex-1">
      <FlashList
        screenScroll
        data={feed.items}
        isLoading={feed.isLoading}
        skeletonVariant="card"
        keyExtractor={(location) => location.id}
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
        emptyText={feed.isError ? "Couldn't load locations." : 'No locations configured yet.'}
        renderItem={({ item: location }) => (
          <ItemLocationCard location={location} uomSymbol={item.uomSymbol} onEdit={openEdit} onDelete={handleDelete} />
        )}
      />
      <Fab onPress={openCreate} accessibilityLabel="Add location" />
      <ItemLocationFormSheet ref={sheetRef} inventoryItemId={item.id} uomSymbol={item.uomSymbol} editing={editing} />
    </View>
  );
}
