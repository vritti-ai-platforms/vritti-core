import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { z, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useUpdatePurchaseOrderItem } from '@/hooks/purchase-orders';
import type { PurchaseOrderItemData } from '@/schemas/purchase-orders';

interface UpdatePurchaseOrderItemDialogProps {
  purchaseOrderId: string;
  poCurrencyCode: string;
  supplierCurrencyCode: string;
  conversionRate: number;
  item: PurchaseOrderItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

const currencyValueSchema = z.object({ currency: z.string(), value: z.string() });

type UpdateLineItemFormData = {
  orderedQuantity: number;
  overridePrice: boolean;
  unitPrice?: { currency: string; value: string } | null;
};

const baseUpdateLineItemSchema = z
  .object({
    orderedQuantity: zodNumericField({ required: 'Quantity is required', positive: true }),
    overridePrice: z.boolean(),
    unitPrice: currencyValueSchema.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!data.unitPrice?.value) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['unitPrice'],
        message: 'Unit price is required.',
      });
    }
  });

export const UpdatePurchaseOrderItemDialog: React.FC<UpdatePurchaseOrderItemDialogProps> = ({
  purchaseOrderId,
  poCurrencyCode,
  conversionRate,
  item,
  onSuccess,
  onCancel,
}) => {
  const supplierUnitPriceNum = Number(item.supplierUnitPrice.value);
  const convertedUnitPriceNum = supplierUnitPriceNum * conversionRate;
  const convertedUnitPrice = { currency: poCurrencyCode, value: String(convertedUnitPriceNum) };

  const unitPriceLabel = `Unit Price (Supplier: ${item.supplierUnitPrice.value})`;

  const updateLineItemSchema = useMemo(
    () =>
      baseUpdateLineItemSchema.superRefine((data, ctx) => {
        if (!data.overridePrice) return;
        const unitPriceNum = Number(data.unitPrice?.value);
        if (Number.isFinite(unitPriceNum) && unitPriceNum === supplierUnitPriceNum) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['unitPrice'],
            message: 'Override price must be different from supplier price.',
          });
        }
      }),
    [supplierUnitPriceNum],
  );

  const isOverrideInitial = item.unitPrice != null && item.unitPrice.value !== String(convertedUnitPriceNum);

  const form = useForm<UpdateLineItemFormData>({
    resolver: zodResolver(updateLineItemSchema),
    defaultValues: {
      orderedQuantity: item.orderedQuantity,
      overridePrice: isOverrideInitial,
      unitPrice: item.unitPrice ?? convertedUnitPrice,
    },
  });
  const watchedOverridePrice = useWatch({ control: form.control, name: 'overridePrice' });
  const mutation = useUpdatePurchaseOrderItem({ onSuccess });

  useEffect(() => {
    form.clearErrors('unitPrice');
    if (!watchedOverridePrice) {
      form.setValue('unitPrice', convertedUnitPrice);
    }
  }, [watchedOverridePrice, convertedUnitPrice.value, form]);

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrderId,
        itemId: item.id,
        orderedQuantity: data.orderedQuantity,
        supplierUnitPrice: item.supplierUnitPrice,
        unitPrice: data.overridePrice ? (data.unitPrice ?? null) : convertedUnitPrice,
      })}
    >
      <TextField name="orderedQuantity" label="Ordered Quantity" type="number" placeholder="e.g. 500" />
      <Switch
        name="overridePrice"
        label="Override Price"
        description="Enable to set a custom unit price for this PO line."
      />
      <CurrencyField
        name="unitPrice"
        label={unitPriceLabel}
        currencyCode={poCurrencyCode}
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
