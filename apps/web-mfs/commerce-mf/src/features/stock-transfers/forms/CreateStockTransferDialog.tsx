import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateStockTransfer } from '@/hooks/stock-transfers';
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
      fromSiteId: '',
      toSiteId: '',
      fromLocationId: undefined,
      toLocationId: undefined,
      quantity: 0,
      notes: '',
    },
  });

  const createMutation = useCreateStockTransfer({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        inventoryItemId: data.inventoryItemId,
        fromSiteId: data.fromSiteId,
        toSiteId: data.toSiteId,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        quantity: data.quantity,
        notes: data.notes || undefined,
      })}
    >
      <InventoryItemSelector name="inventoryItemId" label="Inventory Item" placeholder="Select item" />
      <TextField name="fromSiteId" label="From Location (Site ID)" placeholder="Source site ID" />
      <LocationSelector name="fromLocationId" label="From Location" placeholder="Select source location" />
      <TextField name="toSiteId" label="To Location (Site ID)" placeholder="Destination site ID" />
      <LocationSelector name="toLocationId" label="To Location" placeholder="Select destination location" />
      <TextField name="quantity" label="Quantity" type="number" placeholder="e.g. 100" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Transfer
        </Button>
      </DialogActions>
    </Form>
  );
};
