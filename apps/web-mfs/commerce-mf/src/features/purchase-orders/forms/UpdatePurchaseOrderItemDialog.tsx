import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useUpdatePurchaseOrderItem } from '@/hooks/purchase-orders';
import type { PurchaseOrderItemData } from '@/schemas/purchase-orders';

interface UpdatePurchaseOrderItemDialogProps {
  purchaseOrderId: string;
  conversionRate: number;
  item: PurchaseOrderItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

type UpdateLineItemFormData = {
  orderedQuantity: string;
  overridePrice: boolean;
  unitPrice?: string;
};

const baseUpdateLineItemSchema = z.object({
  orderedQuantity: z.string().min(1, 'Quantity is required'),
  overridePrice: z.boolean(),
  unitPrice: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.unitPrice) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['unitPrice'],
      message: 'Unit price is required.',
    });
  }
});

export const UpdatePurchaseOrderItemDialog: React.FC<UpdatePurchaseOrderItemDialogProps> = ({
  purchaseOrderId,
  conversionRate,
  item,
  onSuccess,
  onCancel,
}) => {
  const supplierConvertedUnitPrice = item.supplierUnitPrice * conversionRate;
  const unitPriceLabel = `Unit Price (Supplier: ${item.supplierUnitPrice.toFixed(2)})`;
  const updateLineItemSchema = useMemo(
    () =>
      baseUpdateLineItemSchema.superRefine((data, ctx) => {
        if (!data.overridePrice) return;
        const unitPrice = Number(data.unitPrice);
        if (Number.isFinite(unitPrice) && unitPrice === item.supplierUnitPrice) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['unitPrice'],
            message: 'Override price must be different from supplier price.',
          });
        }
      }),
    [item.supplierUnitPrice],
  );

  const form = useForm<UpdateLineItemFormData>({
    resolver: zodResolver(updateLineItemSchema),
    defaultValues: {
      orderedQuantity: String(item.orderedQuantity),
      overridePrice: item.unitPrice != null && item.unitPrice !== supplierConvertedUnitPrice,
      unitPrice: item.unitPrice != null ? String(item.unitPrice) : String(supplierConvertedUnitPrice),
    },
  });
  const watchedOverridePrice = useWatch({ control: form.control, name: 'overridePrice' });
  const mutation = useUpdatePurchaseOrderItem({ onSuccess });

  useEffect(() => {
    form.clearErrors('unitPrice');
    if (!watchedOverridePrice) {
      form.setValue('unitPrice', String(supplierConvertedUnitPrice));
    }
  }, [watchedOverridePrice, supplierConvertedUnitPrice, form]);

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrderId,
        itemId: item.id,
        orderedQuantity: Number(data.orderedQuantity),
        supplierUnitPrice: item.supplierUnitPrice,
        unitPrice: data.overridePrice ? Number(data.unitPrice) : supplierConvertedUnitPrice,
      })}
    >
      <TextField name="orderedQuantity" label="Ordered Quantity" type="number" placeholder="e.g. 500" />
      <Switch
        name="overridePrice"
        label="Override Price"
        description="Enable to set a custom unit price for this PO line."
      />
      <TextField
        name="unitPrice"
        label={unitPriceLabel}
        type="number"
        placeholder={watchedOverridePrice ? 'Enter custom unit price' : 'Matches supplier price'}
        disabled={!watchedOverridePrice}
      />
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
