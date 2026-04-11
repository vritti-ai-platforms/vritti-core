import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { StorageLocationSelector } from '@vritti/quantum-ui/selects/storage-location';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useInventoryItemBatchesTable } from '@/hooks/inventory-items';
import { useCreateStockAdjustment } from '@/hooks/useCreateStockAdjustment';
import { type CreateStockAdjustmentFormData, createStockAdjustmentSchema } from '@/schemas/stock-adjustments';

interface CreateStockAdjustmentDialogProps {
  defaultValues?: Partial<CreateStockAdjustmentFormData>;
  onSuccess: () => void;
  onCancel: () => void;
}

const adjustmentTypeOptions = [
  { value: 'OPENING_STOCK', label: 'Opening Stock' },
  { value: 'WASTE', label: 'Waste' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'THEFT', label: 'Theft' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CORRECTION', label: 'Correction' },
  { value: 'PRODUCTION', label: 'Production' },
];

export const CreateStockAdjustmentDialog: React.FC<CreateStockAdjustmentDialogProps> = ({
  defaultValues,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CreateStockAdjustmentFormData>({
    resolver: zodResolver(createStockAdjustmentSchema),
    defaultValues: {
      inventoryItemId: '',
      type: undefined,
      quantity: '',
      reason: '',
      locationId: undefined,
      batchId: undefined,
      manufacturingDate: '',
      expiryDate: '',
      ...defaultValues,
    },
  });

  const selectedType = form.watch('type');
  const watchedItemId = form.watch('inventoryItemId');
  const isOpeningStock = selectedType === 'OPENING_STOCK';

  const { data: batchesResponse } = useInventoryItemBatchesTable(
    !isOpeningStock && watchedItemId ? watchedItemId : null,
  );

  const batchOptions = (batchesResponse?.result ?? []).map((b) => ({
    value: b.id,
    label: [
      b.batchNumber ? `Batch #${b.batchNumber}` : 'Auto Batch',
      b.locationName ? `Location: ${b.locationName}` : null,
      `Qty: ${b.availableQuantity}`,
    ]
      .filter(Boolean)
      .join(' | '),
  }));

  const createMutation = useCreateStockAdjustment({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => {
        const base = {
          inventoryItemId: data.inventoryItemId,
          type: data.type,
          quantity: Number(data.quantity),
          reason: data.reason || undefined,
        };
        if (data.type === 'OPENING_STOCK') {
          return {
            ...base,
            locationId: data.locationId,
            manufacturingDate: data.manufacturingDate || undefined,
            expiryDate: data.expiryDate || undefined,
          };
        }
        return {
          ...base,
          batchId: data.batchId,
        };
      }}
    >
      <InventoryItemSelector name="inventoryItemId" label="Inventory Item" placeholder="Select item" />
      <Select name="type" label="Adjustment Type" placeholder="Select type" options={adjustmentTypeOptions} />
      <TextField name="quantity" label="Quantity" type="number" placeholder="e.g. 50 or -10" />
      <TextArea name="reason" label="Reason" placeholder="Optional reason for adjustment" />

      {isOpeningStock && (
        <>
          <StorageLocationSelector name="locationId" label="Storage Location" placeholder="Select location" />
          <TextField name="manufacturingDate" label="Manufacturing Date" type="date" />
          <TextField name="expiryDate" label="Expiry Date" type="date" />
        </>
      )}

      {!isOpeningStock && selectedType && (
        <Select
          name="batchId"
          label="Batch"
          placeholder={watchedItemId ? 'Select batch' : 'Select an inventory item first'}
          options={batchOptions}
        />
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Add Adjustment
        </Button>
      </div>
    </Form>
  );
};
