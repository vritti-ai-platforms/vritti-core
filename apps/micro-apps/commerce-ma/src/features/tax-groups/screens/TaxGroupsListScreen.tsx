import { NetworkStatus } from "@apollo/client";
import { FlashList } from "@vritti/quantum-ui-native/FlashList";
import { useConfirm, useCreateEditSheet } from "@vritti/quantum-ui-native/hooks";
import { useDebouncedScreenSearch } from "@vritti/quantum-ui-native/ScreenContainer";
import { RefreshControl, View } from "react-native";
import { useDeleteTaxGroup, useTaxGroups } from "../../../hooks/tax-groups";
import type { TaxGroup } from "../../../types/tax-groups";
import { TaxGroupCard } from "../components/TaxGroupCard";
import { TaxGroupFormSheet } from "../forms/TaxGroupFormSheet";

// Tax groups list — one card per group (rates + total inline), with inline edit/delete. The header create (+)
// button and each card's edit action open the same sheet (create vs editing).
export function TaxGroupsList() {
  const debounced = useDebouncedScreenSearch();

  const { data, previousData, loading, refetch, networkStatus } =
    useTaxGroups(debounced);
  // Keep the last good list visible while a new search / refetch is in flight (no flash).
  const groups = ((data ?? previousData)?.taxGroups ?? []) as TaxGroup[];

  // One sheet for create + edit — `editing` null = create. The header (+) fires openCreate via the registry.
  const { sheetRef, editing, openEdit } = useCreateEditSheet<TaxGroup>({ registerCreateAction: true });

  const [deleteTaxGroup] = useDeleteTaxGroup();
  const confirm = useConfirm();
  const handleDelete = async (group: TaxGroup) => {
    const confirmed = await confirm({
      title: `Delete "${group.name}"?`,
      description:
        "This tax group will be permanently removed. This cannot be undone.",
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (confirmed) deleteTaxGroup({ variables: { id: group.id } });
  };

  return (
    <View className="flex-1">
      <FlashList
        screenScroll
        data={groups}
        isLoading={loading}
        skeletonVariant="card"
        keyExtractor={(group) => group.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        refreshControl={
          <RefreshControl
            refreshing={networkStatus === NetworkStatus.refetch}
            onRefresh={() => refetch()}
          />
        }
        emptyText={
          debounced ? "No tax groups match your search." : "No tax groups yet."
        }
        renderItem={({ item }) => (
          <TaxGroupCard
            group={item}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      />
      <TaxGroupFormSheet ref={sheetRef} editing={editing} />
    </View>
  );
}
