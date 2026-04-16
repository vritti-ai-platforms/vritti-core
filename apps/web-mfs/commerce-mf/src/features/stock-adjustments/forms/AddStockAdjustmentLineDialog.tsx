import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { BatchSelector } from '@vritti/quantum-ui/selects/batch';
import { StorageLocationSelector } from '@vritti/quantum-ui/selects/storage-location';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddStockAdjustmentLine } from '@/hooks/stock-adjustments';
import {
  type AddStockAdjustmentLineFormData,
  addStockAdjustmentLineSchema,
  type StockAdjustmentType,
} from '@/schemas/stock-adjustments';

interface AddStockAdjustmentLineDialogProps {
  adjustmentId: string;
  maxQuantity: number;
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
  maxQuantity,
  adjustmentType,
  inventoryItemId,
  onSuccess,
  onCancel,
}) => {
  const isOpeningStock = adjustmentType === 'OPENING_STOCK';
  const schema = addStockAdjustmentLineSchema.superRefine((data, ctx) => {
    if (isOpeningStock && !data.locationId) {
      ctx.addIssue({
        code: 'custom',
        path: ['locationId'],
        message: 'Storage location is required.',
      });
    }
    if (!isOpeningStock && !data.batchId) {
      ctx.addIssue({
        code: 'custom',
        path: ['batchId'],
        message: 'Batch is required.',
      });
    }
  });

  const form = useForm<AddStockAdjustmentLineFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      batchId: undefined,
      locationId: undefined,
      quantity: '',
      manufacturingDate: '',
      expiryDate: '',
    },
  });

  const addLineMutation = useAddStockAdjustmentLine(adjustmentId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={addLineMutation}
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
          <TextField name="quantity" label="Quantity" type="number" placeholder="e.g. 50" max={maxQuantity} />
          <TextField name="manufacturingDate" label="Manufacturing Date" type="date" />
          <TextField name="expiryDate" label="Expiry Date" type="date" />
        </>
      ) : (
        <>
          <BatchSelector
            name="batchId"
            inventoryItemId={inventoryItemId}
            fieldKeys={{
              valueKey: 'id',
              labelKey: 'batchNumber',
              descriptionKey: 'name',
              additionalKeys: 'quantity,reservedQuantity',
              groupIdKey: 'locationId',
            }}
            transformDescription={(description, option) => {
              const quantity = Number(option.additionals?.quantity ?? 0);
              const reservedQuantity = Number(option.additionals?.reservedQuantity ?? 0);
              const availableQuantity = quantity - reservedQuantity;
              return Number.isFinite(availableQuantity)
                ? `Available: ${availableQuantity} | Reserved: ${reservedQuantity}`
                : description;
            }}
          />
          <TextField
            name="quantity"
            label="Quantity"
            type="number"
            placeholder={adjustmentType === 'CORRECTION' ? 'e.g. 50 or -10' : 'e.g. 50'}
            max={maxQuantity}
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
