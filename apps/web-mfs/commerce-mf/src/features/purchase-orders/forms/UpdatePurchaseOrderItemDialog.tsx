import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form } from '@vritti/quantum-ui/Form';
import { formatCurrencyMajor } from '@vritti/quantum-ui/money';
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
  item: PurchaseOrderItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

const currencyValueSchema = z.object({ currency: z.string(), value: z.string() });

type UpdateLineItemFormData = {
  quantity: number;
  overridePrice: boolean;
  unitPrice?: { currency: string; value: string } | null;
  conversionRate: string;
};

const baseUpdateLineItemSchema = z
  .object({
    quantity: zodNumericField({ required: 'Quantity is required', positive: true }),
    overridePrice: z.boolean(),
    unitPrice: currencyValueSchema.optional().nullable(),
    conversionRate: z.string(),
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
  item,
  onSuccess,
  onCancel,
}) => {
  const isSameCurrency = item.itemCurrencyCode === poCurrencyCode;

  const supplierUnitPriceNum = Number(item.supplierUnitPrice.value);
  const convertedUnitPriceNum = supplierUnitPriceNum * item.conversionRate;

  const unitPriceLabel = `Unit Price (Supplier: ${formatCurrencyMajor(Number(item.supplierUnitPrice.value), item.supplierUnitPrice.currency)})`;

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
      quantity: item.quantity,
      overridePrice: isOverrideInitial,
      unitPrice: item.unitPrice ?? { currency: poCurrencyCode, value: String(convertedUnitPriceNum) },
      conversionRate: String(item.conversionRate),
    },
  });
  const watchedOverridePrice = useWatch({ control: form.control, name: 'overridePrice' });
  const mutation = useUpdatePurchaseOrderItem({ onSuccess });

  useEffect(() => {
    form.clearErrors('unitPrice');
    if (!watchedOverridePrice) {
      form.setValue('unitPrice', { currency: poCurrencyCode, value: String(supplierUnitPriceNum * item.conversionRate) });
    }
  }, [watchedOverridePrice, supplierUnitPriceNum, item.conversionRate, poCurrencyCode, form]);

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrderId,
        itemId: item.id,
        quantity: data.quantity,
        conversionRate: isSameCurrency ? item.conversionRate : Number(data.conversionRate),
        supplierUnitPrice: item.supplierUnitPrice,
        unitPrice: data.overridePrice
          ? (data.unitPrice ?? null)
          : { currency: poCurrencyCode, value: String(supplierUnitPriceNum * item.conversionRate) },
      })}
    >
      <TextField name="quantity" label="Quantity" type="number" placeholder="e.g. 500" />
      {!isSameCurrency && (
        <TextField
          name="conversionRate"
          label={`Conversion Rate (${item.itemCurrencyCode} → ${poCurrencyCode})`}
          type="number"
          placeholder="e.g. 1.25"
        />
      )}
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
