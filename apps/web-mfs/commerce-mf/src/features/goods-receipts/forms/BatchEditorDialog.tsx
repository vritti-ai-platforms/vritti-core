import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Dialog } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useDialog } from '@vritti/quantum-ui/hooks';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { StorageLocationSelector } from '@vritti/quantum-ui/selects/storage-location';
import { TextField } from '@vritti/quantum-ui/TextField';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  useAddGoodsReceiptBatch,
  useUpdateGoodsReceiptBatch,
} from '@/hooks/goods-receipts/useGoodsReceiptMutations';

const batchSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory item is required'),
  locationId: z.string().min(1, 'Storage location is required'),
  quantity: z.string().min(1, 'Accepted quantity is required'),
  lotNumber: z.string().max(100).optional(),
  manufacturingDate: z.string().optional(),
  expiryDate: z.string().optional(),
});

type BatchFormData = z.infer<typeof batchSchema>;

type BatchEditorBatch = {
  id: string;
  inventoryItemId: string;
  locationId: string;
  quantity: number;
  lotNumber: string | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
};

const BatchEditorForm = ({
  id,
  itemId,
  batch,
  defaultInventoryItemId,
  onSuccess,
  onCancel,
}: {
  id: string;
  itemId: string;
  batch?: BatchEditorBatch;
  defaultInventoryItemId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const isEdit = Boolean(batch);
  const addMutation = useAddGoodsReceiptBatch(id, itemId, { onSuccess });
  const updateMutation = useUpdateGoodsReceiptBatch(id, itemId, batch?.id ?? '', { onSuccess });

  const form = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      inventoryItemId: batch?.inventoryItemId ?? defaultInventoryItemId ?? '',
      locationId: batch?.locationId ?? '',
      quantity: String(batch?.quantity ?? ''),
      lotNumber: batch?.lotNumber ?? '',
      manufacturingDate: batch?.manufacturingDate ?? '',
      expiryDate: batch?.expiryDate ?? '',
    },
  });

  const transformSubmit = (data: BatchFormData) => ({
    inventoryItemId: data.inventoryItemId,
    locationId: data.locationId,
    quantity: Number(data.quantity),
    lotNumber: data.lotNumber?.trim() || undefined,
    manufacturingDate: data.manufacturingDate || undefined,
    expiryDate: data.expiryDate || undefined,
  });

  const formBody = (
    <>
      <InventoryItemSelector
        name="inventoryItemId"
        label="Inventory Item"
        placeholder="Select item"
        disabled={Boolean(defaultInventoryItemId)}
      />
      <StorageLocationSelector name="locationId" label="Storage Location" placeholder="Select location" />
      <TextField name="quantity" label="Quantity" type="number" positive nonZero />
      <TextField
        name="lotNumber"
        label="Lot Number"
        placeholder="Required for lot/serial-tracked items (e.g. ABC-2024-001)"
      />
      <TextField name="manufacturingDate" label="Manufacturing Date" type="date" />
      <TextField name="expiryDate" label="Expiry Date" type="date" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit">{isEdit ? 'Update Batch' : 'Add Batch'}</Button>
      </div>
    </>
  );

  if (!isEdit) {
    return (
      <Form
        form={form}
        mutation={addMutation}
        resetOnSuccess
        onCancel={onCancel}
        transformSubmit={transformSubmit}
      >
        {formBody}
      </Form>
    );
  }

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={transformSubmit}
    >
      {formBody}
    </Form>
  );
};

export const BatchEditorDialog = ({
  id,
  itemId,
  handle,
  defaultInventoryItemId,
  batch,
}: {
  id: string;
  itemId: string;
  handle: ReturnType<typeof useDialog>;
  defaultInventoryItemId?: string | null;
  batch?: BatchEditorBatch;
}) => (
  <Dialog
    handle={handle}
    title={batch ? 'Edit Batch' : 'Add Batch'}
    description={batch ? 'Update this batch details.' : 'Allocate accepted quantity to a storage location.'}
    content={(close) => (
      <BatchEditorForm
        id={id}
        itemId={itemId}
        batch={batch}
        defaultInventoryItemId={defaultInventoryItemId}
        onSuccess={close}
        onCancel={close}
      />
    )}
  />
);
