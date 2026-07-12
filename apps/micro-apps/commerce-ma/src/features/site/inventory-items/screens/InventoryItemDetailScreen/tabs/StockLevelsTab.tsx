import { FlashList } from "@vritti/quantum-ui-native/FlashList";
import { Spinner } from "@vritti/quantum-ui-native/Spinner";
import { RefreshControl, View } from "react-native";
import { useStockLevelsFeed } from "../../../../../../hooks/site/stock-levels";
import type { InventoryItem } from "../../../../../../types/inventory-items";
import { StockLevelCard } from "../../../components/StockLevelCard";

// Read-only per-location stock levels with Relay infinite scroll (an item can span >100 locations).
export function StockLevelsTab({ item }: { item: InventoryItem }) {
  const feed = useStockLevelsFeed(item.id);

  return (
    <View className="flex-1">
      <FlashList
        screenScroll
        data={feed.items}
        isLoading={feed.isLoading}
        skeletonVariant="card"
        keyExtractor={(stock) => stock.id}
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
        emptyText={feed.isError ? "Couldn't load stock levels." : "No stock in any location yet."}
        renderItem={({ item: stock }) => <StockLevelCard stock={stock} uomSymbol={item.uomSymbol} />}
      />
    </View>
  );
}
