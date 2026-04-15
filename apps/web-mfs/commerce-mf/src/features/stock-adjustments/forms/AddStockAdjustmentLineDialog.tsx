import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { StorageLocationSelector } from '@vritti/quantum-ui/selects/storage-location';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useInventoryItemBatchesTable } from '@/hooks/inventory-items';
import { useAddStockAdjustmentLine } from '@/hooks/stock-adjustments';
import {
  type AddStockAdjustmentLineFormData,
  addStockAdjustmentLineSchema,
  type StockAdjustmentType,
} from '@/schemas/stock-adjustments';

interface AddStockAdjustmentLineDialogProps {
  adjustmentId: string;
  adjustmentType: StockAdjustmentType;
  inventoryItemId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function formatLocationPathLabel(path: string): string {
  return path
    .split('.')
    .map((segment) =>
      segment
        .split('_')
        .filter(Boolean)
        .map((part) => part.toUpperCase())
        .join(' '),
    )
    .join(' / ');
}

export const AddStockAdjustmentLineDialog: React.FC<AddStockAdjustmentLineDialogProps> = ({
  adjustmentId,
  adjustmentType,
  inventoryItemId,
  onSuccess,
  onCancel,
}) => {
  const isOpeningStock = adjustmentType === 'OPENING_STOCK';

  const form = useForm<AddStockAdjustmentLineFormData>({
    resolver: zodResolver(addStockAdjustmentLineSchema),
    defaultValues: {
      batchId: undefined,
      locationId: undefined,
      quantity: '',
      manufacturingDate: '',
      expiryDate: '',
    },
  });

  const { data: batchesResponse } = useInventoryItemBatchesTable(!isOpeningStock ? inventoryItemId : null);

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

  const addLineMutation = useAddStockAdjustmentLine(adjustmentId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={addLineMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => {
        const base = {
          quantity: Number(data.quantity),
        };
        if (isOpeningStock) {
          return {
            ...base,
            locationId: data.locationId || undefined,
            manufacturingDate: data.manufacturingDate || undefined,
            expiryDate: data.expiryDate || undefined,
          };
        }
        return {
          ...base,
          batchId: data.batchId || undefined,
        };
      }}
    >
      {isOpeningStock ? (
        <>
          <StorageLocationSelector
            name="locationId"
            label="Storage Location"
            placeholder="Select location"
            fieldKeys={{ valueKey: 'id', labelKey: 'path' }}
            transformLabel={(label) => formatLocationPathLabel(label)}
          />
          <TextField name="quantity" label="Quantity" type="number" placeholder="e.g. 50" />
          <TextField name="manufacturingDate" label="Manufacturing Date" type="date" />
          <TextField name="expiryDate" label="Expiry Date" type="date" />
        </>
      ) : (
        <>
          <Select name="batchId" label="Batch" placeholder="Select batch" options={batchOptions} />
          <TextField
            name="quantity"
            label="Quantity"
            type="number"
            placeholder={adjustmentType === 'CORRECTION' ? 'e.g. 50 or -10' : 'e.g. 50'}
          />
        </>
      )}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Line
        </Button>
      </div>
    </Form>
  );
};
