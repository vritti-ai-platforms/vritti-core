import { useQuery } from '@apollo/client/react';
import { type RouteProp, useNavigation } from "@react-navigation/native";
import { registerConnection } from "@vritti/quantum-ui-native/apollo";
import { Button } from "@vritti/quantum-ui-native/Button";
import { Card } from "@vritti/quantum-ui-native/Card";
import { DynamicIcon } from "@vritti/quantum-ui-native/DynamicIcon";
import { FlashList } from "@vritti/quantum-ui-native/FlashList";
import { useConfirm } from "@vritti/quantum-ui-native/hooks";
import {
  PushNavigator,
  type PushScreenConfig,
} from "@vritti/quantum-ui-native/PushNavigator";
import { ScreenContainer, useScreenSearch } from "@vritti/quantum-ui-native/ScreenContainer";
import { ScreenHeader } from "@vritti/quantum-ui-native/ScreenHeader";
import { Spinner } from "@vritti/quantum-ui-native/Spinner";
import { StaticAlert } from "@vritti/quantum-ui-native/StaticAlert";
import { Text } from "@vritti/quantum-ui-native/Text";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { RefreshControl, View } from "react-native";
import type {
  FilterCondition,
  InventoryItem,
  SearchState,
  SortCondition,
} from "../../types/list";
import { InventoryItemCard } from "./components/InventoryItemCard";
import { trackingLabel, typeLabel } from "../../services/inventory-items";
import { INVENTORY_ITEM_QUERY } from "../../graphql/inventory-items";
import {
  useCreateInventoryItem,
  useDeleteInventoryItem,
  useInventoryItemsFeed,
  useUpdateInventoryItem,
} from "../../hooks/inventory-items";
import {
  createInventoryItemSchema,
  type CreateInventoryItemFormValues,
  updateInventoryItemSchema,
  type UpdateInventoryItemFormValues,
} from "../../schemas/inventory-items/inventory-item";
import { InventoryItemForm } from "./forms/InventoryItemForm";

// Register this micro-app's cache policies on the host's shared Apollo cache: relayStylePagination on
// the `inventoryItems` feed connection + a by-id read redirect for `inventoryItem`. Runs once at module
// eval — this is the MF-exposed feature entry the host lazily imports, so it executes before any screen
// here mounts or queries. The host cache stays schema-agnostic; these policies are present for the first
// read (registering in a hook/effect would be too late and miss the page-1 relay merge).
registerConnection({
  field: "inventoryItems",
  keyArgs: ["filters", "search", "sort"],
  singleField: "inventoryItem",
  typename: "InventoryItem",
});

type InventoryRoute =
  | "InventoryList"
  | "InventoryItemDetail"
  | "InventoryItemCreate"
  | "InventoryItemEdit";

// Detail + Edit take the item id (not the whole row), so they read it live from the cache and reflect
// edits immediately. PushNavigator.push is param-less, so we use React Navigation's navigate directly.
interface InventoryItemDetailParams {
  id: string;
}

interface InventoryItemEditParams {
  id: string;
}

type InventoryNavigation = {
  navigate: {
    (screen: "InventoryItemDetail", params: InventoryItemDetailParams): void;
    (screen: "InventoryItemEdit", params: InventoryItemEditParams): void;
    (screen: "InventoryItemCreate"): void;
  };
  goBack: () => void;
};

// Single-item query result shape.
interface InventoryItemQueryData {
  inventoryItem: InventoryItem | null;
}

// Stable empty refs (filters/sort not exposed yet) — the feed key only varies by `search`.
const EMPTY_FILTERS: FilterCondition[] = [];
const EMPTY_SORT: SortCondition[] = [];
const SEARCH_DEBOUNCE_MS = 300;

const CREATE_ICON = { sfSymbol: "plus", materialIcon: "add" } as const;

function CreateButton() {
  const navigation = useNavigation() as unknown as InventoryNavigation;
  return (
    <Button
      variant="glass"
      size="icon"
      onPress={() => navigation.navigate("InventoryItemCreate")}
      accessibilityLabel="Create item"
      hitSlop={8}
    >
      <DynamicIcon icon={CREATE_ICON} size={24} />
    </Button>
  );
}

function InventoryList() {
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
  const navigation = useNavigation() as unknown as InventoryNavigation;
  const confirm = useConfirm();
  const id = route.params?.id;

  // cache-only: the item is already fully cached from the feed (same InventoryItemFields fragment), so
  // the detail never needs the network. Crucially this stops it from refetching inventoryItem(id) after
  // a delete evicts the record — which would call findById on the deleted id and 500. Edits still
  // reflect because the update mutation auto-merges into the cached InventoryItem:{id}.
  const { data, loading } = useQuery<InventoryItemQueryData>(INVENTORY_ITEM_QUERY, {
    variables: { id },
    skip: !id,
    fetchPolicy: "cache-only",
  });
  const item = data?.inventoryItem;

  const [deleteItem, { loading: deleting, error: deleteError }] = useDeleteInventoryItem();

  if (loading && !item) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Spinner size="large" />
      </ScreenContainer>
    );
  }

  if (!item) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-base text-muted-foreground">
          No item selected.
        </Text>
      </ScreenContainer>
    );
  }

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: `Delete ${item.name}?`,
      description: `${item.name} will be permanently removed. This cannot be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (!confirmed) return;
    // cache.evict drops the row from the list automatically; go back to it on success.
    const result = await deleteItem({ variables: { id: item.id } });
    if (!result.error) navigation.goBack();
  };

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

      {deleteError ? (
        <StaticAlert
          variant="destructive"
          title="Delete failed"
          description={deleteError.message}
        />
      ) : null}

      <View className="gap-3">
        <Button onPress={() => navigation.navigate("InventoryItemEdit", { id: item.id })}>
          <Text>Edit item</Text>
        </Button>
        <Button variant="destructive" isLoading={deleting} onPress={handleDelete}>
          <Text>Delete item</Text>
        </Button>
      </View>
    </ScreenContainer>
  );
}

function InventoryItemCreate() {
  const navigation = useNavigation() as unknown as InventoryNavigation;
  const [createItem, { loading, error }] = useCreateInventoryItem();

  const form = useForm<CreateInventoryItemFormValues>({
    resolver: zodResolver(createInventoryItemSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "RAW_MATERIAL",
      tracking: "quantity",
      pickStrategy: "none",
      categoryId: "",
      uomId: "",
      purchaseTaxGroupId: "",
      description: "",
      hsnCode: "",
      hasMrp: false,
    },
  });

  const handleSubmit = async (values: CreateInventoryItemFormValues) => {
    // cache.modify prepends the created item into the feed — no refetch needed; go back to the list.
    const result = await createItem({ variables: { input: values } });
    if (!result.error) navigation.goBack();
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={{ padding: 16, gap: 16 }}>
      {error ? (
        <StaticAlert variant="destructive" title="Create failed" description={error.message} />
      ) : null}
      <InventoryItemForm
        form={form}
        isSubmitting={loading}
        onSubmit={(v) => handleSubmit(v as CreateInventoryItemFormValues)}
        mode="create"
      />
    </ScreenContainer>
  );
}

function InventoryItemEdit({
  route,
}: {
  route: RouteProp<{ InventoryItemEdit: InventoryItemEditParams }, "InventoryItemEdit">;
}) {
  const navigation = useNavigation() as unknown as InventoryNavigation;
  const id = route.params?.id;

  // cache-only (like InventoryItemDetail): the item is already cached from the feed (same
  // InventoryItemFields fragment), and the normalized cache reflects prior edits, so the form prefills
  // with no network read. Under the cache-and-network default an unset policy would background-fetch
  // inventoryItem(id) and race/overwrite the save mutation in the shared InventoryItem:{id} record —
  // which the list row reads — causing a ~1s stale flash on the list after editing.
  const { data, loading: loadingItem } = useQuery<InventoryItemQueryData>(INVENTORY_ITEM_QUERY, {
    variables: { id },
    skip: !id,
    fetchPolicy: "cache-only",
  });
  const item = data?.inventoryItem;

  const [updateItem, { loading: updating, error }] = useUpdateInventoryItem();

  const form = useForm<UpdateInventoryItemFormValues>({
    resolver: zodResolver(updateInventoryItemSchema),
    values: item
      ? {
          name: item.name,
          code: item.code,
          type: item.type,
          pickStrategy: item.pickStrategy,
          categoryId: item.categoryId,
          uomId: item.uomId,
          purchaseTaxGroupId: item.purchaseTaxGroupId ?? "",
          description: item.description ?? "",
          hsnCode: item.hsnCode ?? "",
          hasMrp: false,
        }
      : undefined,
  });

  const handleSubmit = async (values: UpdateInventoryItemFormValues) => {
    if (!id) return;
    // The mutation returns the entity → Apollo auto-merges by id, so list + detail update on success.
    const result = await updateItem({ variables: { id, input: values } });
    if (!result.error) navigation.goBack();
  };

  if (loadingItem && !item) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Spinner size="large" />
      </ScreenContainer>
    );
  }

  if (!item) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <Text className="text-base text-muted-foreground">No item selected.</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable contentContainerStyle={{ padding: 16, gap: 16 }}>
      {error ? (
        <StaticAlert variant="destructive" title="Update failed" description={error.message} />
      ) : null}
      <InventoryItemForm
        form={form}
        isSubmitting={updating}
        onSubmit={(v) => handleSubmit(v as UpdateInventoryItemFormValues)}
        mode="edit"
      />
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
        rightActions={<CreateButton />}
      />
    ),
  },
  {
    name: "InventoryItemDetail",
    component: InventoryItemDetail,
    headerShown: true,
    title: "Item Detail",
  },
  {
    name: "InventoryItemCreate",
    component: InventoryItemCreate,
    headerShown: true,
    title: "New Item",
  },
  {
    name: "InventoryItemEdit",
    component: InventoryItemEdit,
    headerShown: true,
    title: "Edit Item",
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
