import { useNavigation } from "@react-navigation/native";
import { Button } from "@vritti/quantum-ui-native/Button";
import { Card } from "@vritti/quantum-ui-native/Card";
import { useConfirm } from "@vritti/quantum-ui-native/hooks";
import { ScreenContainer } from "@vritti/quantum-ui-native/ScreenContainer";
import { StaticAlert } from "@vritti/quantum-ui-native/StaticAlert";
import { Text } from "@vritti/quantum-ui-native/Text";
import { View } from "react-native";
import { useDeleteInventoryItem } from "../../../../../hooks/inventory-items";
import {
  trackingLabel,
  typeLabel,
} from "../../../../../services/inventory-items";
import type { InventoryItem } from "../../../../../types/list";

// Minimal nav surface this tab needs (mirrors the screen's InventoryNavigation).
type OverviewNavigation = {
  navigate: (screen: "InventoryItemEdit", params: { id: string }) => void;
  goBack: () => void;
};

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

// Overview tab — the item's core fields + Edit/Delete. (Edit/Delete live here because the ScreenHeader
// tabs variant has no rightActions slot.) The item name/code are shown in the header title/subtitle.
export function OverviewTab({ item }: { item: InventoryItem }) {
  const navigation = useNavigation() as unknown as OverviewNavigation;
  const confirm = useConfirm();
  const [deleteItem, { loading: deleting, error: deleteError }] =
    useDeleteInventoryItem();

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

      <Button
        onPress={() =>
          navigation.navigate("InventoryItemEdit", { id: item.id })
        }
      >
        <Text>Edit item</Text>
      </Button>

      {/* Danger zone — destructive-accented section for the irreversible delete (mirrors the web).
          Delete is disabled when the item is referenced by other records (item.canDelete === false). */}
      <Card className="gap-3 border border-destructive/40 bg-destructive/5 p-4">
        <Text className="text-sm font-semibold text-destructive">
          Danger zone
        </Text>
        <Text className="text-sm text-muted-foreground">
          {item.canDelete
            ? "Deleting this item is permanent and can't be undone."
            : "This item is referenced by other records, so it can't be deleted."}
        </Text>
        {deleteError ? (
          <StaticAlert
            variant="destructive"
            title="Delete failed"
            description={deleteError.message}
            className="border-destructive/40"
          />
        ) : null}
        <Button
          variant="destructive"
          isLoading={deleting}
          disabled={!item.canDelete}
          onPress={handleDelete}
        >
          <Text>Delete item</Text>
        </Button>
      </Card>
    </ScreenContainer>
  );
}
