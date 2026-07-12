import { DynamicIcon } from "@vritti/quantum-ui-native/DynamicIcon";
import { Fab } from "@vritti/quantum-ui-native/Fab";
import { FlashList } from "@vritti/quantum-ui-native/FlashList";
import { useConfirm, useCreateEditSheet } from "@vritti/quantum-ui-native/hooks";
import { View } from "react-native";
import {
  useDeleteUomConversion,
  useUomConversions,
} from "../../../../../../hooks/site/uom-conversions";
import type { InventoryItem } from "../../../../../../types/inventory-items";
import type { UomConversion } from "../../../../../../types/uom-conversions";
import { UomConversionCard } from "../../../components/UomConversionCard";
import { UomConversionFormSheet } from "../../../forms/UomConversionFormSheet";

const PLUS_ICON = { sfSymbol: "plus", materialSymbol: "add" } as const;

// UOM Conversions tab — lists an item's conversion overrides; the FAB opens a bottom sheet to add one, and
// tapping an editable conversion opens the same sheet prefilled. Delete is confirm-first (canDelete-gated).
export function UomConversionsTab({ item }: { item: InventoryItem }) {
  const { data, loading } = useUomConversions(item.id);
  const conversions = (data?.inventoryItemUomConversions ??
    []) as UomConversion[];
  const [deleteConversion] = useDeleteUomConversion();
  const confirm = useConfirm();

  const { sheetRef, editing, openCreate, openEdit } = useCreateEditSheet<UomConversion>();

  const handleDelete = async (conversion: UomConversion) => {
    const confirmed = await confirm({
      title: "Delete conversion?",
      description: `Remove the ${conversion.uomName} conversion. This can't be undone.`,
      confirmLabel: "Delete",
      variant: "destructive",
    });
    if (confirmed) deleteConversion({ variables: { id: conversion.id } });
  };

  return (
    <View className="flex-1">
      <FlashList
        screenScroll
        data={conversions}
        isLoading={loading}
        skeletonVariant="card"
        keyExtractor={(conversion) => conversion.id}
        contentContainerStyle={{ padding: 16 }}
        ItemSeparatorComponent={() => <View className="h-3" />}
        emptyText="No UOM conversions yet."
        renderItem={({ item: conversion }) => (
          <UomConversionCard
            conversion={conversion}
            primaryUomSymbol={item.uomSymbol}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}
      />
      <Fab onPress={openCreate} accessibilityLabel="Add UOM conversion">
        <DynamicIcon icon={PLUS_ICON} size={24} />
      </Fab>
      <UomConversionFormSheet
        ref={sheetRef}
        inventoryItemId={item.id}
        primaryUomSymbol={item.uomSymbol}
        editing={editing}
      />
    </View>
  );
}
