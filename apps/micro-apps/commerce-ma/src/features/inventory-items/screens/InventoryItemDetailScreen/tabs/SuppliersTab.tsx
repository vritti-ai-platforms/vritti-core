import { FlashList } from "@vritti/quantum-ui-native/FlashList";
import { Spinner } from "@vritti/quantum-ui-native/Spinner";
import { RefreshControl, View } from "react-native";
import { useSuppliersFeed } from "../../../../../hooks/suppliers";
import type { InventoryItem } from "../../../../../types/inventory-items";
import { SupplierCard } from "../../../components/SupplierCard";

// Read-only per-item supplier links with Relay infinite scroll (an item can have many suppliers).
export function SuppliersTab({ item }: { item: InventoryItem }) {
  const feed = useSuppliersFeed(item.id);

  return (
    <View className="flex-1">
      <FlashList
        screenScroll
        data={feed.items}
        isLoading={feed.isLoading}
        skeletonVariant="card"
        keyExtractor={(supplier) => supplier.id}
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
        emptyText={feed.isError ? "Couldn't load suppliers." : "No suppliers linked yet."}
        renderItem={({ item: supplier }) => <SupplierCard supplier={supplier} />}
      />
    </View>
  );
}
