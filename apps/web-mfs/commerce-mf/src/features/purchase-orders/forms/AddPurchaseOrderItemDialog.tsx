import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form } from '@vritti/quantum-ui/Form';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import { z, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAddPurchaseOrderItem } from '@/hooks/purchase-orders';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';

interface AddPurchaseOrderItemDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  existingItemIds: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

const currencyValueSchema = z.object({ currency: z.string(), value: z.string() });

type AddLineItemFormData = {
  inventoryItemId: string;
  orderedQuantity: number;
  overridePrice: boolean;
  unitPrice?: { currency: string; value: string } | null;
  conversionRate: string;
};

const baseAddLineItemSchema = z
  .object({
    inventoryItemId: z.string().min(1, 'Item is required'),
    orderedQuantity: zodNumericField({ required: 'Quantity is required', positive: true }),
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

    if (data.unitPrice?.value) {
      const unitPrice = Number(data.unitPrice.value);
      if (Number.isNaN(unitPrice) || unitPrice < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['unitPrice'],
          message: 'Unit price must be a valid non-negative number.',
        });
      }
    }
  });

export const AddPurchaseOrderItemDialog: React.FC<AddPurchaseOrderItemDialogProps> = ({
  purchaseOrder,
  existingItemIds,
  onSuccess,
  onCancel,
}) => {
  const mutation = useAddPurchaseOrderItem({ onSuccess });

  // Raw supplier unit price number from the inventory item option
  const [supplierUnitPrice, setSupplierUnitPrice] = useState<number | null>(null);
  // Currency code for the selected inventory item
  const [itemCurrencyCode, setItemCurrencyCode] = useState<string | null>(null);

  const isSameCurrency = itemCurrencyCode != null && itemCurrencyCode === purchaseOrder.currencyCode;

  const addLineItemSchema = useMemo(
    () =>
      baseAddLineItemSchema.superRefine((data, ctx) => {
        if (!data.overridePrice) return;
        const unitPriceNum = Number(data.unitPrice?.value);
        if (Number.isFinite(unitPriceNum) && supplierUnitPrice != null && unitPriceNum === supplierUnitPrice) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['unitPrice'],
            message: 'Override price must be different from supplier price.',
          });
        }
      }),
    [supplierUnitPrice],
  );

  const form = useForm<AddLineItemFormData>({
    resolver: zodResolver(addLineItemSchema),
    defaultValues: {
      inventoryItemId: '',
      orderedQuantity: 0,
      overridePrice: false,
      unitPrice: null,
      conversionRate: '1',
    },
  });

  const watchedOverridePrice = useWatch({ control: form.control, name: 'overridePrice' });
  const watchedConversionRate = useWatch({ control: form.control, name: 'conversionRate' });

  const effectiveRate = isSameCurrency
    ? purchaseOrder.conversionRate
    : Number(watchedConversionRate) || purchaseOrder.conversionRate;

  const convertedSupplierUnitPrice = supplierUnitPrice != null ? supplierUnitPrice * effectiveRate : null;

  const excludeIds = existingItemIds.join(',');
  const unitPriceLabel =
    supplierUnitPrice != null ? `Unit Price (Supplier: ${supplierUnitPrice.toFixed(2)})` : 'Unit Price';

  useEffect(() => {
    form.clearErrors('unitPrice');
    if (!watchedOverridePrice) {
      form.setValue(
        'unitPrice',
        convertedSupplierUnitPrice != null
          ? { currency: purchaseOrder.currencyCode, value: String(convertedSupplierUnitPrice) }
          : null,
      );
    }
  }, [watchedOverridePrice, convertedSupplierUnitPrice, purchaseOrder.currencyCode, form]);

  const handleItemSelect = (option: SelectOption | null) => {
    const nextPrice = option?.additionals?.unitPrice;
    const parsed =
      typeof nextPrice === 'number' ? nextPrice : typeof nextPrice === 'string' ? Number(nextPrice) : Number.NaN;
    const unitPrice = Number.isFinite(parsed) ? parsed : null;

    const nextCurrencyCode =
      typeof option?.additionals?.currencyCode === 'string' ? option.additionals.currencyCode : null;

    setSupplierUnitPrice(unitPrice);
    setItemCurrencyCode(nextCurrencyCode);
    form.setValue('overridePrice', false);
    form.setValue('conversionRate', '1');

    const nextIsSameCurrency = nextCurrencyCode != null && nextCurrencyCode === purchaseOrder.currencyCode;
    const nextRate = nextIsSameCurrency ? purchaseOrder.conversionRate : 1;

    form.setValue(
      'unitPrice',
      unitPrice != null ? { currency: purchaseOrder.currencyCode, value: String(unitPrice * nextRate) } : null,
    );
  };

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => {
        const submitRate = isSameCurrency ? purchaseOrder.conversionRate : Number(data.conversionRate);
        const submitConvertedPrice = supplierUnitPrice != null ? supplierUnitPrice * submitRate : null;
        return {
          id: purchaseOrder.id,
          inventoryItemId: data.inventoryItemId,
          orderedQuantity: data.orderedQuantity,
          conversionRate: submitRate,
          supplierUnitPrice: {
            currency: itemCurrencyCode ?? purchaseOrder.supplierCurrencyCode ?? purchaseOrder.currencyCode,
            value: String(supplierUnitPrice ?? Number(data.unitPrice?.value ?? '0')),
          },
          unitPrice: data.overridePrice
            ? (data.unitPrice ?? null)
            : submitConvertedPrice != null
              ? { currency: purchaseOrder.currencyCode, value: String(submitConvertedPrice) }
              : (data.unitPrice ?? null),
        };
      }}
    >
      <InventoryItemSelector
        name="inventoryItemId"
        label="Inventory Item"
        placeholder="Select item"
        fieldKeys={{ valueKey: 'id', labelKey: 'name', additionalKeys: 'symbol,unitPrice,currencyCode', groupIdKey: 'categoryId' }}
        transformLabel={(label, option) => {
          const baseLabel = label.replace(/\s-\s[^-]+$/, '');
          const uom = typeof option.additionals?.symbol === 'string' ? option.additionals.symbol.trim() : '';
          const unitPrice = option.additionals?.unitPrice;

          if (unitPrice && uom) return `${baseLabel} - ${unitPrice}/${uom}`;
          if (unitPrice) return `${baseLabel} - ${unitPrice}`;
          if (uom) return `${baseLabel} (${uom})`;
          return baseLabel;
        }}
        onOptionSelect={handleItemSelect}
        params={{ excludeIds, supplierId: purchaseOrder.supplierId }}
      />
      <TextField name="orderedQuantity" label="Ordered Quantity" type="number" placeholder="e.g. 500" />
      {itemCurrencyCode != null && !isSameCurrency && (
        <TextField
          name="conversionRate"
          label={`Conversion Rate (${itemCurrencyCode} → ${purchaseOrder.currencyCode})`}
          type="number"
          placeholder="e.g. 1.25"
        />
      )}
      <Switch
        name="overridePrice"
        label="Override Price"
        description="Enable to set a custom unit price for this PO line."
        disabled={supplierUnitPrice == null}
      />
      <CurrencyField
        name="unitPrice"
        label={unitPriceLabel}
        currencyCode={purchaseOrder.currencyCode}
        placeholder={watchedOverridePrice ? 'Enter custom unit price' : 'Supplier price'}
        disabled={!watchedOverridePrice || supplierUnitPrice == null}
      />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Line Item
        </Button>
      </div>
    </Form>
  );
};
