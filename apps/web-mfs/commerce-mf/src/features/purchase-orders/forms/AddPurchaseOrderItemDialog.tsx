import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form } from '@vritti/quantum-ui/Form';
import { formatCurrency, formatCurrencyMajor, minorToMajor } from '@vritti/quantum-ui/money';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { SupplierItemSelector } from '@vritti/quantum-ui/selects/supplier-item';
import { UomSelector } from '@vritti/quantum-ui/selects/uom';
import { z, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAddPurchaseOrderItem } from '@/hooks/purchase-orders';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';

interface AddPurchaseOrderItemDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

const currencyValueSchema = z.object({ currency: z.string(), value: z.string() });

type AddLineItemFormData = {
  inventoryItemId: string;
  uomId: string;
  quantity: number;
  overridePrice: boolean;
  unitPrice?: { currency: string; value: string } | null;
};

const baseAddLineItemSchema = z
  .object({
    inventoryItemId: z.string().min(1, 'Item is required'),
    uomId: z.string().min(1, 'UOM is required'),
    quantity: zodNumericField({ required: 'Quantity is required', positive: true }),
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
  onSuccess,
  onCancel,
}) => {
  const mutation = useAddPurchaseOrderItem({ onSuccess });

  const [supplierUnitPrice, setSupplierUnitPrice] = useState<number | null>(null);
  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);

  const isSameCurrency =
    purchaseOrder.supplierCurrencyCode === purchaseOrder.currencyCode;

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
      uomId: '',
      quantity: 0,
      overridePrice: false,
      unitPrice: null,
    },
  });

  const watchedOverridePrice = useWatch({ control: form.control, name: 'overridePrice' });
  const watchedInventoryItemId = useWatch({ control: form.control, name: 'inventoryItemId' });

  const supplierCurrencyCode = purchaseOrder.supplierCurrencyCode ?? purchaseOrder.currencyCode;
  const unitPriceLabel =
    supplierUnitPrice != null
      ? `Unit Price (Supplier: ${formatCurrencyMajor(supplierUnitPrice, supplierCurrencyCode)})`
      : 'Unit Price';

  useEffect(() => {
    form.setValue('uomId', '');
  }, [watchedInventoryItemId, form]);

  useEffect(() => {
    form.clearErrors('unitPrice');
    if (!watchedOverridePrice) {
      const convertedPrice =
        supplierUnitPrice != null ? supplierUnitPrice * purchaseOrder.conversionRate : null;
      form.setValue(
        'unitPrice',
        convertedPrice != null
          ? { currency: purchaseOrder.currencyCode, value: String(convertedPrice) }
          : null,
      );
    }
  }, [watchedOverridePrice, supplierUnitPrice, purchaseOrder.conversionRate, purchaseOrder.currencyCode, form]);

  const handleItemSelect = (option: SelectOption | null) => {
    const nextCurrencyCode =
      typeof option?.additionals?.currencyCode === 'string' ? option.additionals.currencyCode : null;

    const rawMinor = option?.additionals?.unitPrice;
    const unitPrice =
      rawMinor != null && nextCurrencyCode != null
        ? Number(minorToMajor(String(rawMinor), nextCurrencyCode))
        : null;

    setSupplierUnitPrice(Number.isFinite(unitPrice) ? unitPrice : null);
    setAllowDecimal(option?.additionals?.allowDecimal === true);
    form.setValue('overridePrice', false);

    form.setValue(
      'unitPrice',
      unitPrice != null
        ? {
            currency: purchaseOrder.currencyCode,
            value: String(unitPrice * purchaseOrder.conversionRate),
          }
        : null,
    );
  };

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => {
        const submitConvertedPrice =
          supplierUnitPrice != null ? supplierUnitPrice * purchaseOrder.conversionRate : null;
        return {
          id: purchaseOrder.id,
          inventoryItemId: data.inventoryItemId,
          uomId: data.uomId,
          quantity: data.quantity,
          supplierUnitPrice: {
            currency: isSameCurrency ? purchaseOrder.currencyCode : supplierCurrencyCode,
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
      <SupplierItemSelector
        name="inventoryItemId"
        label="Inventory Item"
        placeholder="Select item"
        supplierId={purchaseOrder.supplierId}
        params={{ purchaseOrderId: purchaseOrder.id }}
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
      />
      <UomSelector
        name="uomId"
        label="UOM"
        placeholder={watchedInventoryItemId ? 'Select unit' : 'Select inventory item first'}
        disabled={!watchedInventoryItemId}
        params={
          watchedInventoryItemId
            ? {
                inventoryItemId: watchedInventoryItemId,
                supplierId: purchaseOrder.supplierId,
                purchaseOrderId: purchaseOrder.id,
              }
            : undefined
        }
      />
      <TextField name="quantity" label="Quantity" type="number" placeholder="e.g. 500" integer={!allowDecimal} positive />
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
