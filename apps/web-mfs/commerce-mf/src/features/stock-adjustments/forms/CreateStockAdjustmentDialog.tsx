import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { StorageLocationSelector } from '@vritti/quantum-ui/selects/storage-location';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateStockAdjustment } from '@/hooks/useCreateStockAdjustment';
import { type CreateStockAdjustmentFormData, createStockAdjustmentSchema } from '@/schemas/stock-adjustments';

interface CreateStockAdjustmentDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const adjustmentTypeOptions = [
  { value: 'WASTE', label: 'Waste' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'THEFT', label: 'Theft' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CORRECTION', label: 'Correction' },
  { value: 'PRODUCTION', label: 'Production' },
];

export const CreateStockAdjustmentDialog: React.FC<CreateStockAdjustmentDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateStockAdjustmentFormData>({
    resolver: zodResolver(createStockAdjustmentSchema),
    defaultValues: {
      inventoryItemId: '',
      locationId: undefined,
      type: undefined,
      quantity: '',
      reason: '',
    },
  });

  const createMutation = useCreateStockAdjustment({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        inventoryItemId: data.inventoryItemId,
        locationId: data.locationId,
        type: data.type,
        quantity: Number(data.quantity),
        reason: data.reason || undefined,
      })}
    >
      <InventoryItemSelector name="inventoryItemId" label="Inventory Item" placeholder="Select item" />
      <StorageLocationSelector name="locationId" label="Storage Location" placeholder="Select location" />
      <Select name="type" label="Adjustment Type" placeholder="Select type" options={adjustmentTypeOptions} />
      <TextField name="quantity" label="Quantity" type="number" placeholder="e.g. -50 or 100" />
      <TextArea name="reason" label="Reason" placeholder="Optional reason for adjustment" />
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
