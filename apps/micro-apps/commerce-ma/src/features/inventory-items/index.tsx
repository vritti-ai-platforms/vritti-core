import { type RouteProp, useNavigation } from "@react-navigation/native";
import { Card } from "@vritti/quantum-ui-native/Card";
import { FlashList } from "@vritti/quantum-ui-native/FlashList";
import {
  PushNavigator,
  type PushScreenConfig,
} from "@vritti/quantum-ui-native/PushNavigator";
import { ScreenContainer, useScreenSearch } from "@vritti/quantum-ui-native/ScreenContainer";
import { ScreenHeader } from "@vritti/quantum-ui-native/ScreenHeader";
import { Spinner } from "@vritti/quantum-ui-native/Spinner";
import { Text } from "@vritti/quantum-ui-native/Text";
import { useEffect, useMemo, useState } from "react";
import { RefreshControl, View } from "react-native";
import type {
  FilterCondition,
  InventoryItem,
  SearchState,
  SortCondition,
} from "../../types/list";
import { InventoryItemCard } from "./components/InventoryItemCard";
import { trackingLabel, typeLabel } from "./filterOptions";
import { useInventoryItemsFeed } from "./hooks/useInventoryItemsFeed";

type InventoryRoute = "InventoryList" | "InventoryItemDetail";

// The full row is passed as a nav param (it's a plain serializable object). PushNavigator.push is
// param-less, so we use React Navigation's navigate directly — same as the UOM feature.
interface InventoryItemDetailParams {
  item: InventoryItem;
}

// Stable empty refs (filters/sort not exposed yet) — the feed key only varies by `search`.
const EMPTY_FILTERS: FilterCondition[] = [];
const EMPTY_SORT: SortCondition[] = [];
const SEARCH_DEBOUNCE_MS = 300;

function InventoryList() {
  const navigation = useNavigation() as unknown as {
    navigate: (
      screen: "InventoryItemDetail",
      params: InventoryItemDetailParams,
    ) => void;
  };

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
            navigation.navigate("InventoryItemDetail", { item: selected })
          }
        />
      )}
    />
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <View className="gap-1">
      <Text className="text-xs uppercase text-muted-foreground">{label}</Text>
      <Text className="text-base font-semibold text-foreground">
        {value ?? "—"}
      </Text>
    </View>
  );
}

function InventoryItemDetail({
  route,
}: {
  route: RouteProp<
    { InventoryItemDetail: InventoryItemDetailParams },
    "InventoryItemDetail"
  >;
}) {
  const item = route.params?.item;

  if (!item) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-base text-muted-foreground">
          No item selected.
        </Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      scrollable
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <Text className="text-2xl font-bold text-foreground">{item.name}</Text>
      <Card className="gap-3 p-4">
        <DetailRow label="Code" value={item.code} />
        <DetailRow label="Type" value={typeLabel(item.type)} />
        <DetailRow label="Tracking" value={trackingLabel(item.tracking)} />
        <DetailRow label="Pick strategy" value={item.pickStrategy} />
        <DetailRow label="Category" value={item.categoryName} />
        <DetailRow label="Unit of measure" value={item.uomSymbol} />
        <DetailRow label="HSN code" value={item.hsnCode} />
        <DetailRow label="Description" value={item.description} />
      </Card>
    </ScreenContainer>
  );
}

const screens: ReadonlyArray<PushScreenConfig<InventoryRoute>> = [
  {
    name: "InventoryList",
    component: InventoryList,
    header: () => (
      <ScreenHeader
        title="Inventory Items"
        subtitle="Browse and manage your stock items"
        searchable
        searchPlaceholder="Search by name or code"
      />
    ),
  },
  {
    name: "InventoryItemDetail",
    component: InventoryItemDetail,
    headerShown: true,
    title: "Item Detail",
  },
];

export default function InventoryItemsScreen() {
  return (
    <PushNavigator<InventoryRoute>
      initialRoute="InventoryList"
      screens={screens}
    />
  );
}
