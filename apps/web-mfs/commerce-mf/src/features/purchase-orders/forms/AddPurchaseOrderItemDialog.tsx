import { zodResolver } from '@hookform/resolvers/zod';
import type { UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/api-response';
import { Button } from '@vritti/quantum-ui/Button';
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

type AddLineItemFormData = {
  inventoryItemId: string;
  orderedQuantity: string;
  overridePrice: boolean;
  unitPrice?: string;
};

const baseAddLineItemSchema = z
  .object({
    inventoryItemId: z.string().min(1, 'Item is required'),
    orderedQuantity: z.string().min(1, 'Quantity is required'),
    overridePrice: z.boolean(),
    unitPrice: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.unitPrice) {
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

    if (data.unitPrice) {
      const unitPrice = Number(data.unitPrice);
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
  const [supplierUnitPrice, setSupplierUnitPrice] = useState<number | null>(null);
  const convertedSupplierUnitPrice =
    supplierUnitPrice != null ? supplierUnitPrice * purchaseOrder.conversionRate : null;
  const addLineItemSchema = useMemo(
    () =>
      baseAddLineItemSchema.superRefine((data, ctx) => {
        if (!data.overridePrice) return;
        const unitPrice = Number(data.unitPrice);
        if (Number.isFinite(unitPrice) && supplierUnitPrice != null && unitPrice === supplierUnitPrice) {
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
      unitPrice: '',
    },
  });

  const excludeIds = existingItemIds.join(',');
  const unitPriceLabel =
    supplierUnitPrice != null ? `Unit Price (Supplier: ${supplierUnitPrice.toFixed(2)})` : 'Unit Price';

  const watchedOverridePrice = useWatch({ control: form.control, name: 'overridePrice' });

  useEffect(() => {
    form.clearErrors('unitPrice');
    if (!watchedOverridePrice) {
      form.setValue('unitPrice', convertedSupplierUnitPrice != null ? String(convertedSupplierUnitPrice) : '');
    }
  }, [watchedOverridePrice, convertedSupplierUnitPrice, form]);

  const handleItemSelect = (option: SelectOption | null) => {
    const nextPrice = option?.additionals?.unitPrice;
    const parsed =
      typeof nextPrice === 'number' ? nextPrice : typeof nextPrice === 'string' ? Number(nextPrice) : Number.NaN;
    const unitPrice = Number.isFinite(parsed) ? parsed : null;

    setSupplierUnitPrice(unitPrice);
    form.setValue('overridePrice', false);
    form.setValue(
      'unitPrice',
      unitPrice != null ? String(unitPrice * purchaseOrder.conversionRate) : '',
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
        supplierUnitPrice: supplierUnitPrice != null ? supplierUnitPrice : Number(data.unitPrice),
        unitPrice: data.overridePrice
          ? Number(data.unitPrice)
          : convertedSupplierUnitPrice != null
            ? convertedSupplierUnitPrice
            : Number(data.unitPrice),
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
      <TextField
        name="unitPrice"
        label={unitPriceLabel}
        type="number"
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
