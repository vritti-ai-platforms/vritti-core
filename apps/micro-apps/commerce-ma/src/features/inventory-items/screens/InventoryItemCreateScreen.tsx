import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import { ScreenContainer } from "@vritti/quantum-ui-native/ScreenContainer";
import { StaticAlert } from "@vritti/quantum-ui-native/StaticAlert";
import { useForm } from "react-hook-form";
import { useCreateInventoryItem } from "../../../hooks/inventory-items";
import {
  createInventoryItemSchema,
  type CreateInventoryItemFormValues,
} from "../../../schemas/inventory-items/inventory-item";
import { InventoryItemForm } from "../forms/InventoryItemForm";
import type { InventoryNavigation } from "../types";

export function InventoryItemCreate() {
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
