import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form } from '@vritti/quantum-ui/Form';
import { formatCurrency, formatCurrencyMajor, minorToMajor } from '@vritti/quantum-ui/money';
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
  quantity: number;
  overridePrice: boolean;
  unitPrice?: { currency: string; value: string } | null;
  conversionRate: string;
};

const baseAddLineItemSchema = z
  .object({
    inventoryItemId: z.string().min(1, 'Item is required'),
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

  const [supplierUnitPrice, setSupplierUnitPrice] = useState<number | null>(null);
  const [itemCurrencyCode, setItemCurrencyCode] = useState<string | null>(null);
  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);

  const isSameCurrency = itemCurrencyCode != null && itemCurrencyCode === purchaseOrder.currencyCode;

  const addLineItemSchema = useMemo(
    () =>
      baseAddLineItemSchema.superRefine((data, ctx) => {
        if (!data.overridePrice) return;
        const unitPriceNum = Number(data.unitPrice?.value);
        if (Number.isFinite(unitPriceNum) && supplierUnitPrice != null && unitPriceNum === supplierUnitPrice) {
          ctx.addIssue({
            code: 'custom',
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
      quantity: 0,
      overridePrice: false,
      unitPrice: null,
      conversionRate: '1',
    },
  });

  const watchedOverridePrice = useWatch({ control: form.control, name: 'overridePrice' });
  const watchedConversionRate = useWatch({ control: form.control, name: 'conversionRate' });

  const excludeIds = existingItemIds.join(',');
  const unitPriceLabel =
    supplierUnitPrice != null && itemCurrencyCode != null
      ? `Unit Price (Supplier: ${formatCurrencyMajor(supplierUnitPrice, itemCurrencyCode)})`
      : 'Unit Price';

  useEffect(() => {
    form.clearErrors('unitPrice');
    if (!watchedOverridePrice) {
      const rate = isSameCurrency
        ? purchaseOrder.conversionRate
        : Number(watchedConversionRate) || purchaseOrder.conversionRate;
      const convertedPrice = supplierUnitPrice != null ? supplierUnitPrice * rate : null;
      form.setValue(
        'unitPrice',
        convertedPrice != null
          ? { currency: purchaseOrder.currencyCode, value: String(convertedPrice) }
          : null,
      );
    }
  }, [watchedOverridePrice, supplierUnitPrice, isSameCurrency, purchaseOrder.conversionRate, watchedConversionRate, purchaseOrder.currencyCode, form]);

  const handleItemSelect = (option: SelectOption | null) => {
    const nextCurrencyCode =
      typeof option?.additionals?.currencyCode === 'string' ? option.additionals.currencyCode : null;

    const rawMinor = option?.additionals?.unitPrice;
    const unitPrice =
      rawMinor != null && nextCurrencyCode != null
        ? Number(minorToMajor(String(rawMinor), nextCurrencyCode))
        : null;

    setSupplierUnitPrice(Number.isFinite(unitPrice) ? unitPrice : null);
    setItemCurrencyCode(nextCurrencyCode);
    setAllowDecimal(option?.additionals?.allowDecimal === true);
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
          quantity: data.quantity,
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
        fieldKeys={{
          valueKey: 'id',
          labelKey: 'name',
          additionalKeys: 'symbol,unitPrice,currencyCode,allowDecimal',
          groupIdKey: 'categoryId',
        }}
        transformLabel={(label, option) => {
          const baseLabel = label.replace(/\s-\s[^-]+$/, '');
          const uom = typeof option.additionals?.symbol === 'string' ? option.additionals.symbol.trim() : '';
          const rawPrice = option.additionals?.unitPrice;
          const currencyCode = typeof option.additionals?.currencyCode === 'string' ? option.additionals.currencyCode : null;
          const unitPrice =
            rawPrice != null && currencyCode != null
              ? formatCurrency(String(rawPrice), currencyCode)
              : null;

          if (unitPrice && uom) return `${baseLabel} - ${unitPrice}/${uom}`;
          if (unitPrice) return `${baseLabel} - ${unitPrice}`;
          if (uom) return `${baseLabel} (${uom})`;
          return baseLabel;
        }}
        onOptionSelect={handleItemSelect}
        params={{ excludeIds, supplierId: purchaseOrder.supplierId }}
      />
      <TextField name="quantity" label="Quantity" type="number" placeholder="e.g. 500" integer={!allowDecimal} positive />
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
