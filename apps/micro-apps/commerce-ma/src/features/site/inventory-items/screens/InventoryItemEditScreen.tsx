import { useQuery } from '@apollo/client/react';
import { type RouteProp, useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@vritti/quantum-ui-native/ScreenContainer';
import { Spinner } from '@vritti/quantum-ui-native/Spinner';
import { StaticAlert } from '@vritti/quantum-ui-native/StaticAlert';
import { Text } from '@vritti/quantum-ui-native/Text';
import { zodResolver } from '@vritti/quantum-ui-native/zod';
import { useForm } from 'react-hook-form';
import { INVENTORY_ITEM_QUERY } from '../../../../graphql/inventory-items';
import { useUpdateInventoryItem } from '../../../../hooks/site/inventory-items';
import {
  type UpdateInventoryItemFormValues,
  updateInventoryItemSchema,
} from '../../../../schemas/inventory-items/inventory-item';
import { InventoryItemForm } from '../forms/InventoryItemForm';
import type { InventoryItemEditParams, InventoryItemQueryData, InventoryNavigation } from '../types';

export function InventoryItemEdit({
  route,
}: {
  route: RouteProp<{ InventoryItemEdit: InventoryItemEditParams }, 'InventoryItemEdit'>;
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
    fetchPolicy: 'cache-only',
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
          purchaseTaxGroupId: item.purchaseTaxGroupId ?? '',
          description: item.description ?? '',
          hsnCode: item.hsnCode ?? '',
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
      {error ? <StaticAlert variant="destructive" title="Update failed" description={error.message} /> : null}
      <InventoryItemForm
        form={form}
        isSubmitting={updating}
        onSubmit={(v) => handleSubmit(v as UpdateInventoryItemFormValues)}
        mode="edit"
      />
    </ScreenContainer>
  );
}
