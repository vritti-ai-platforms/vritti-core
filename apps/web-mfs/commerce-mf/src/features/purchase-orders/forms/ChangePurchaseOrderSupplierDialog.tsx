import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { SupplierSelector } from '@vritti/quantum-ui/selects/supplier';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useChangePurchaseOrderSupplier } from '@/hooks/purchase-orders';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';

interface ChangePurchaseOrderSupplierDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  hasLines: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

const changeSupplierSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
});

type ChangeSupplierFormData = z.infer<typeof changeSupplierSchema>;

export const ChangePurchaseOrderSupplierDialog: React.FC<ChangePurchaseOrderSupplierDialogProps> = ({
  purchaseOrder,
  hasLines,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<ChangeSupplierFormData>({
    resolver: zodResolver(changeSupplierSchema),
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
      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Updating...">
          Change Supplier
        </Button>
      </div>
    </Form>
  );
};
