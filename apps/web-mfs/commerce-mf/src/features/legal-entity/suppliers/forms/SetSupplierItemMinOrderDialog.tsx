import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useBulkSetSupplierItemMinOrder } from '@/hooks/legal-entity/suppliers';
import { type SetSupplierItemMinOrderFormData, setSupplierItemMinOrderSchema } from '@/schemas/suppliers';

interface SetSupplierItemMinOrderDialogProps {
  supplierId: string;
  supplierItemIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const SetSupplierItemMinOrderDialog: React.FC<SetSupplierItemMinOrderDialogProps> = ({
  supplierId,
  supplierItemIds,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<SetSupplierItemMinOrderFormData>({
    resolver: zodResolver(setSupplierItemMinOrderSchema),
  });

  const mutation = useBulkSetSupplierItemMinOrder(supplierId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ supplierItemIds, minOrderQuantity: data.minOrderQuantity ?? null })}
    >
      <TextField
        name="minOrderQuantity"
        label="Min Order Qty"
        type="number"
        positive
        placeholder="e.g. 10"
        description="The least the supplier sells per order, in each item's own unit. Leave blank to clear it."
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Apply
        </Button>
      </DialogActions>
    </Form>
  );
};
