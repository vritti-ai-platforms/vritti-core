import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateStockTransfer } from '@/hooks/useCreateStockTransfer';
import { type CreateStockTransferFormData, createStockTransferSchema } from '@/schemas/stock-transfers';

interface CreateStockTransferDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const CreateStockTransferDialog: React.FC<CreateStockTransferDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateStockTransferFormData>({
    resolver: zodResolver(createStockTransferSchema),
    defaultValues: {
      inventoryItemId: '',
      fromBuId: '',
      toBuId: '',
      quantity: '',
      notes: '',
    },
  });

  const createMutation = useCreateStockTransfer({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      showRootError
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        inventoryItemId: data.inventoryItemId,
        fromBuId: data.fromBuId,
        toBuId: data.toBuId,
        quantity: Number(data.quantity),
        notes: data.notes || undefined,
      })}
    >
      <InventoryItemSelector name="inventoryItemId" label="Inventory Item" placeholder="Select item" />
      <TextField name="fromBuId" label="From Location (BU ID)" placeholder="Source business unit ID" />
      <TextField name="toBuId" label="To Location (BU ID)" placeholder="Destination business unit ID" />
      <TextField name="quantity" label="Quantity" type="number" placeholder="e.g. 100" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Transfer
        </Button>
      </div>
    </Form>
  );
};
