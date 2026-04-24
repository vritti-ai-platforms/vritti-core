import { zodResolver } from '@hookform/resolvers/zod';
import type { UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/api-response';
import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form } from '@vritti/quantum-ui/Form';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import type { AxiosError } from 'axios';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import type { PurchaseOrderData, PurchaseOrderDetail } from '@/schemas/purchase-orders';
import { type AddPurchaseOrderItemPayload } from '@/services/purchase-orders.service';

interface AddPurchaseOrderItemDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  existingItemIds: string[];
  mutation: UseMutationResult<CreateResponse<PurchaseOrderData>, AxiosError, AddPurchaseOrderItemPayload>;
  onCancel: () => void;
}

const currencyValueSchema = z.object({ currency: z.string(), value: z.string() });

type AddLineItemFormData = {
  inventoryItemId: string;
  orderedQuantity: string;
  overridePrice: boolean;
  unitPrice?: { currency: string; value: string } | null;
};

const baseAddLineItemSchema = z
  .object({
    inventoryItemId: z.string().min(1, 'Item is required'),
    orderedQuantity: z.string().min(1, 'Quantity is required'),
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

    const orderedQuantity = Number(data.orderedQuantity);
    if (Number.isNaN(orderedQuantity) || orderedQuantity < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['orderedQuantity'],
        message: 'Quantity must be a valid non-negative number.',
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
  mutation,
  onCancel,
}) => {
  // Raw supplier unit price number from the inventory item option
  const [supplierUnitPrice, setSupplierUnitPrice] = useState<number | null>(null);
  const convertedSupplierUnitPrice =
    supplierUnitPrice != null ? supplierUnitPrice * purchaseOrder.conversionRate : null;

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
      orderedQuantity: '',
      overridePrice: false,
      unitPrice: null,
    },
  });

  const excludeIds = existingItemIds.join(',');
  const unitPriceLabel =
    supplierUnitPrice != null
      ? `Unit Price (Supplier: ${supplierUnitPrice.toFixed(2)})`
      : 'Unit Price';

  const watchedOverridePrice = useWatch({ control: form.control, name: 'overridePrice' });

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

    setSupplierUnitPrice(unitPrice);
    form.setValue('overridePrice', false);
    form.setValue(
      'unitPrice',
      unitPrice != null
        ? { currency: purchaseOrder.currencyCode, value: String(unitPrice * purchaseOrder.conversionRate) }
        : null,
    );

    if (unitPrice == null) {
      form.setValue('overridePrice', false);
    }
  };

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrder.id,
        inventoryItemId: data.inventoryItemId,
        orderedQuantity: Number(data.orderedQuantity),
        supplierUnitPrice: {
          currency: purchaseOrder.supplierCurrencyCode ?? purchaseOrder.currencyCode,
          value: String(supplierUnitPrice ?? Number(data.unitPrice?.value ?? '0')),
        },
        unitPrice: data.overridePrice
          ? data.unitPrice ?? null
          : convertedSupplierUnitPrice != null
            ? { currency: purchaseOrder.currencyCode, value: String(convertedSupplierUnitPrice) }
            : data.unitPrice ?? null,
      })}
    >
      <InventoryItemSelector
        name="inventoryItemId"
        label="Inventory Item"
        placeholder="Select item"
        fieldKeys={{ valueKey: 'id', labelKey: 'name', additionalKeys: 'symbol,unitPrice', groupIdKey: 'categoryId' }}
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
