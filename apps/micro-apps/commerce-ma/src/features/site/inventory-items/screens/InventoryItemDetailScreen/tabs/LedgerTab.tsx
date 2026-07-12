import { FlashList } from "@vritti/quantum-ui-native/FlashList";
import { Spinner } from "@vritti/quantum-ui-native/Spinner";
import { RefreshControl, View } from "react-native";
import { useLedgerFeed } from "../../../../../../hooks/site/ledger";
import type { InventoryItem } from "../../../../../../types/inventory-items";
import { LedgerCard } from "../../../components/LedgerCard";

// Read-only stock-movement ledger with Relay infinite scroll (newest first).
export function LedgerTab({ item }: { item: InventoryItem }) {
  const feed = useLedgerFeed(item.id);

  return (
    <View className="flex-1">
      <FlashList
        screenScroll
        data={feed.items}
        isLoading={feed.isLoading}
        skeletonVariant="card"
        keyExtractor={(entry) => entry.id}
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
        emptyText={feed.isError ? "Couldn't load ledger." : "No stock movements yet."}
        renderItem={({ item: entry }) => <LedgerCard entry={entry} uomSymbol={item.uomSymbol} />}
      />
    </View>
  );
}
