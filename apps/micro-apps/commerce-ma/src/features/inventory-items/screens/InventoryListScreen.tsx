import { useNavigation } from "@react-navigation/native";
import { FlashList } from "@vritti/quantum-ui-native/FlashList";
import { useScreenSearch } from "@vritti/quantum-ui-native/ScreenContainer";
import { Spinner } from "@vritti/quantum-ui-native/Spinner";
import { useEffect, useMemo, useState } from "react";
import { RefreshControl, View } from "react-native";
import { useInventoryItemsFeed } from "../../../hooks/inventory-items";
import type { FilterCondition, SearchState, SortCondition } from "../../../types/list";
import { InventoryItemCard } from "../components/InventoryItemCard";
import type { InventoryNavigation } from "../types";

// Stable empty refs (filters/sort not exposed yet) — the feed key only varies by `search`.
const EMPTY_FILTERS: FilterCondition[] = [];
const EMPTY_SORT: SortCondition[] = [];
const SEARCH_DEBOUNCE_MS = 300;

export function InventoryList() {
  const navigation = useNavigation() as unknown as InventoryNavigation;

  // The search field lives in the ScreenHeader; its value arrives here via the route-keyed registry.
  // Debounce before it hits the feed (a new search = a fresh p1 stream; keepPreviousData avoids a flash).
  const { query } = useScreenSearch();
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [query]);
  const search = useMemo<SearchState | null>(
    () => (debounced.length > 0 ? { columnId: "all", value: debounced } : null),
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
      keyExtractor={(item) => item.id}
      onEndReached={() => {
        if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={feed.isFetchingNextPage ? <View className="py-4"><Spinner /></View> : null}
      refreshControl={<RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refresh()} />}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
      ItemSeparatorComponent={() => <View className="h-3" />}
      emptyText={
        feed.isError
          ? "Couldn't load items."
          : search
            ? "No items match your search."
            : "No inventory items yet."
      }
      renderItem={({ item }) => (
        <InventoryItemCard
          item={item}
          onPress={(selected) =>
            navigation.navigate("InventoryItemDetail", { id: selected.id })
          }
        />
      )}
    />
  );
}
