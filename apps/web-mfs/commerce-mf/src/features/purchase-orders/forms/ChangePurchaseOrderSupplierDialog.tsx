import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { SupplierSelector } from '@vritti/quantum-ui/selects/supplier';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useChangePurchaseOrderSupplier } from '@/hooks/purchase-orders';
import {
  type ChangePurchaseOrderSupplierFormData,
  changePurchaseOrderSupplierSchema,
  type PurchaseOrderDetail,
} from '@/schemas/purchase-orders';

interface ChangePurchaseOrderSupplierDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  hasLines: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ChangePurchaseOrderSupplierDialog: React.FC<ChangePurchaseOrderSupplierDialogProps> = ({
  purchaseOrder,
  hasLines,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<ChangePurchaseOrderSupplierFormData>({
    resolver: zodResolver(changePurchaseOrderSupplierSchema),
    defaultValues: {
      supplierId: purchaseOrder.supplierId,
    },
  });

  const changeSupplierMutation = useChangePurchaseOrderSupplier({ onSuccess });

  if (hasLines) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Remove all line items before changing supplier.</p>
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form
      form={form}
      mutation={changeSupplierMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrder.id,
        supplierId: data.supplierId,
      })}
    >
      <SupplierSelector name="supplierId" label="Supplier" placeholder="Select supplier" />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Updating...">
          Change Supplier
        </Button>
      </DialogActions>
    </Form>
  );
};
