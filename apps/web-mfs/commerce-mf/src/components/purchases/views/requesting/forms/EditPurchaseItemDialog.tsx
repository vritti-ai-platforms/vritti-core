import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type PurchaseHeader,
  type PurchaseItem,
  type UpdatePurchaseItemFormData,
  updatePurchaseItemSchema,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../../../bindings';

interface EditPurchaseItemDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  item: PurchaseItem;
  onSuccess: () => void;
  onCancel: () => void;
}

// Changes how much of an item the purchase needs, by when, and its notes
export const EditPurchaseItemDialog: React.FC<EditPurchaseItemDialogProps> = ({
  binding,
  purchase,
  item,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdatePurchaseItemFormData>({
    resolver: zodResolver(updatePurchaseItemSchema),
    defaultValues: { primaryQty: item.primaryQty, neededBy: item.neededBy, notes: item.notes ?? '' },
  });
  const updateMutation = binding.useUpdateItem({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchase.id,
        itemId: item.id,
        primaryQty: data.primaryQty,
        neededBy: data.neededBy || null,
        notes: data.notes.trim() || null,
      })}
    >
      <TextField
        name="primaryQty"
        label={item.primaryUomSymbol ? `Quantity (${item.primaryUomSymbol})` : 'Quantity'}
        type="number"
        positive
        nonZero
      />
      <DatePicker name="neededBy" label="Needed By" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Item
        </Button>
      </DialogActions>
    </Form>
  );
};
