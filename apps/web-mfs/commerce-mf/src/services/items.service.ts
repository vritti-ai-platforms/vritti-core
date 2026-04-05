import type { SuccessResponse } from '@vritti/quantum-ui/api-response';
import axios from '@vritti/quantum-ui/axios';
import type {
  ItemData,
  ItemDetail,
  ItemModifierGroup,
  ItemVariant,
  SaveOptionsPayload,
  UpdateVariantData,
} from '@/schemas/items';

export interface CreateItemPayload {
  type: 'PRODUCT' | 'SERVICE';
  name: string;
  categoryId?: string;
  basePrice: number;
  businessUnitId: string;
}

export interface UpdateItemPayload {
  name?: string;
  description?: string | null;
  basePrice?: number;
  costPrice?: number | null;
  taxGroupId?: string | null;
  hsnSacCode?: string | null;
  isVisible?: boolean;
  trackInventory?: boolean;
  categoryId?: string | null;
}

// Lists all items for a business unit
export function listItems(buId: string): Promise<ItemData[]> {
  return axios
    .get<ItemData[]>(`commerce-api/items?buId=${buId}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Creates a new catalog item
export function createItem(data: CreateItemPayload): Promise<ItemData> {
  return axios
    .post<ItemData>('commerce-api/items', data, {
      loadingMessage: 'Creating item...',
      successMessage: 'Item created',
    })
    .then((r) => r.data);
}

// Fetches full item details by ID
export function getItem(id: string): Promise<ItemDetail> {
  return axios
    .get<ItemDetail>(`commerce-api/items/${id}`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Updates an item's basic info
export function updateItem({ id, data }: { id: string; data: UpdateItemPayload }): Promise<ItemData> {
  return axios
    .patch<ItemData>(`commerce-api/items/${id}`, data, {
      loadingMessage: 'Updating item...',
      successMessage: 'Item updated',
    })
    .then((r) => r.data);
}

// Deletes an item by ID
export function deleteItem(id: string): Promise<SuccessResponse> {
  return axios
    .delete<SuccessResponse>(`commerce-api/items/${id}`, {
      loadingMessage: 'Deleting item...',
      successMessage: 'Item deleted',
    })
    .then((r) => r.data);
}

// Bulk saves options for an item
export function saveItemOptions({ id, data }: { id: string; data: SaveOptionsPayload }): Promise<ItemDetail> {
  return axios
    .put<ItemDetail>(`commerce-api/items/${id}/options`, data, {
      loadingMessage: 'Saving options...',
      successMessage: 'Options saved',
    })
    .then((r) => r.data);
}

// Generates variants from current item options
export function generateVariants(itemId: string): Promise<ItemVariant[]> {
  return axios
    .post<ItemVariant[]>(`commerce-api/items/${itemId}/variants/generate`, {}, {
      loadingMessage: 'Generating variants...',
      successMessage: 'Variants generated',
    })
    .then((r) => r.data);
}

// Lists all variants for an item
export function listVariants(itemId: string): Promise<ItemVariant[]> {
  return axios
    .get<ItemVariant[]>(`commerce-api/items/${itemId}/variants`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Updates a single variant
export function updateVariant({
  itemId,
  variantId,
  data,
}: {
  itemId: string;
  variantId: string;
  data: UpdateVariantData;
}): Promise<ItemVariant> {
  return axios
    .patch<ItemVariant>(`commerce-api/items/${itemId}/variants/${variantId}`, data, {
      loadingMessage: 'Updating variant...',
      successMessage: 'Variant updated',
    })
    .then((r) => r.data);
}

// Batch updates multiple variants for an item
export function batchUpdateVariants(
  itemId: string,
  updates: { variantId: string; data: UpdateVariantData }[],
): Promise<void> {
  return Promise.allSettled(
    updates.map(({ variantId, data }) =>
      axios.patch(`commerce-api/items/${itemId}/variants/${variantId}`, data).then(() => undefined),
    ),
  ).then(() => undefined);
}

// Lists modifier groups assigned to an item
export function listItemModifiers(itemId: string): Promise<ItemModifierGroup[]> {
  return axios
    .get<ItemModifierGroup[]>(`commerce-api/items/${itemId}/modifiers`, { showSuccessToast: false })
    .then((r) => r.data);
}

// Deletes a single variant from an item
export function deleteVariant({ itemId, variantId }: { itemId: string; variantId: string }): Promise<void> {
  return axios
    .delete(`commerce-api/items/${itemId}/variants/${variantId}`)
    .then(() => undefined);
}

// Assigns modifier groups to an item (replaces all)
export function saveItemModifiers({
  itemId,
  groupIds,
}: {
  itemId: string;
  groupIds: string[];
}): Promise<ItemModifierGroup[]> {
  return axios
    .put<ItemModifierGroup[]>(`commerce-api/items/${itemId}/modifiers`, { groupIds }, {
      loadingMessage: 'Saving modifiers...',
      successMessage: 'Modifiers saved',
    })
    .then((r) => r.data);
}
