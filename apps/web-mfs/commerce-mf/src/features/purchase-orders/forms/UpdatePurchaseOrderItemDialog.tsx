import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdatePurchaseOrderItem } from '@/hooks/purchase-orders';
import {
  type PurchaseOrderItemData,
  type UpdatePurchaseOrderItemFormData,
  updatePurchaseOrderItemSchema,
} from '@/schemas/purchase-orders';

interface UpdatePurchaseOrderItemDialogProps {
  purchaseOrderId: string;
  poCurrencyCode: string;
  item: PurchaseOrderItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const UpdatePurchaseOrderItemDialog: React.FC<UpdatePurchaseOrderItemDialogProps> = ({
  purchaseOrderId,
  poCurrencyCode,
  item,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdatePurchaseOrderItemFormData>({
    resolver: zodResolver(updatePurchaseOrderItemSchema),
    defaultValues: {
      uomQty: item.uomQty,
      unitPrice: item.unitPrice,
    },
  });
  const mutation = useUpdatePurchaseOrderItem({ onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrderId,
        itemId: item.id,
        uomQty: data.uomQty ?? undefined,
        unitPrice: data.unitPrice as { currency: string; value: string } | undefined,
      })}
    >
      {item.orderUomSymbol && (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">UOM</span>
          <span className="text-sm text-muted-foreground">{item.orderUomSymbol}</span>
        </div>
      )}
      <TextField name="uomQty" label="Quantity" type="number" placeholder="e.g. 500" />
      <CurrencyField name="unitPrice" label="Unit Price" currencyCode={poCurrencyCode} placeholder="Enter unit price" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Updating...">
          Update Line Item
        </Button>
      </div>
    </Form>
  );
};
