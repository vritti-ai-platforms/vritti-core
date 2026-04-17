import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateStockAdjustment } from '@/hooks/stock-adjustments';
import type { StockAdjustmentData } from '@/schemas/stock-adjustments';
import { type CreateStockAdjustmentFormData, createStockAdjustmentSchema } from '@/schemas/stock-adjustments';

interface CreateStockAdjustmentDialogProps {
  onSuccess: (adjustment: StockAdjustmentData) => void;
  onCancel: () => void;
}

const adjustmentTypeOptions = [
  { value: 'OPENING_STOCK', label: 'Opening Stock' },
  { value: 'WASTE', label: 'Waste' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'THEFT', label: 'Theft' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CORRECTION', label: 'Correction' },
];

export const CreateStockAdjustmentDialog: React.FC<CreateStockAdjustmentDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateStockAdjustmentFormData>({
    resolver: zodResolver(createStockAdjustmentSchema),
    defaultValues: {
      inventoryItemId: '',
      type: undefined,
      quantity: '',
      reason: '',
    },
  });

  const createMutation = useCreateStockAdjustment({
    onSuccess: (data) => onSuccess(data),
  });

  return (
    <Form
      form={form}
      mutation={createMutation}
     
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        inventoryItemId: data.inventoryItemId,
        type: data.type,
        quantity: Number(data.quantity),
        reason: data.reason,
      })}
    >
      <InventoryItemSelector name="inventoryItemId" label="Inventory Item" placeholder="Select item" />
      <Select name="type" label="Adjustment Type" placeholder="Select type" options={adjustmentTypeOptions} />
      <TextField name="quantity" label="Quantity" type="number" placeholder="e.g. 100" />
      <TextArea name="reason" label="Reason" placeholder="Enter reason for adjustment" />

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Draft
        </Button>
      </div>
    </Form>
  );
};
