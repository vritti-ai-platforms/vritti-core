import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type PurchaseOrderDetail,
  type UpdatePurchaseOrderTaxDateFormData,
  updatePurchaseOrderTaxDateSchema,
} from '@/schemas/purchase-orders';
import type { PurchaseOrdersBinding } from '../bindings';

interface UpdateTaxDateDialogProps {
  binding: PurchaseOrdersBinding;
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

// Changes the date tax is determined on; the lines that follow the order move with it, lines with their own keep it
export const UpdateTaxDateDialog: React.FC<UpdateTaxDateDialogProps> = ({
  binding,
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdatePurchaseOrderTaxDateFormData>({
    resolver: zodResolver(updatePurchaseOrderTaxDateSchema),
    defaultValues: { taxDate: purchaseOrder.taxDate },
  });
  const mutation = binding.useUpdateTaxDate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: purchaseOrder.id, taxDate: data.taxDate })}
    >
      <DatePicker name="taxDate" label="Tax Date" description="May be before the order date" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Updating...">
          Update Tax Date
        </Button>
      </DialogActions>
    </Form>
  );
};
