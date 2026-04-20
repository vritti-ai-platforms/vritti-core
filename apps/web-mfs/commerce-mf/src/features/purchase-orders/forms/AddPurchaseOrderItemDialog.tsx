import { zodResolver } from '@hookform/resolvers/zod';
import type { UseMutationResult } from '@tanstack/react-query';
import type { CreateResponse } from '@vritti/quantum-ui/api-response';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { InventoryItemSelector } from '@vritti/quantum-ui/selects/inventory-item';
import { TextField } from '@vritti/quantum-ui/TextField';
import type { AxiosError } from 'axios';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import type { PurchaseOrderData, PurchaseOrderDetail } from '@/schemas/purchase-orders';
import { type AddPurchaseOrderItemPayload, getSupplierItemPrice } from '@/services/purchase-orders.service';

interface AddPurchaseOrderItemDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  existingItemIds: string[];
  mutation: UseMutationResult<CreateResponse<PurchaseOrderData>, AxiosError, AddPurchaseOrderItemPayload>;
  onCancel: () => void;
}

const addLineItemSchema = z.object({
  inventoryItemId: z.string().min(1, 'Item is required'),
  orderedQuantity: z.string().min(1, 'Quantity is required'),
  unitPrice: z.string().optional(),
});

type AddLineItemFormData = z.infer<typeof addLineItemSchema>;

export const AddPurchaseOrderItemDialog: React.FC<AddPurchaseOrderItemDialogProps> = ({
  purchaseOrder,
  existingItemIds,
  mutation,
  onCancel,
}) => {
  const [isPriceLooking, setIsPriceLooking] = useState(false);
  const [resolvedUnitPrice, setResolvedUnitPrice] = useState<number | null>(null);

  const form = useForm<AddLineItemFormData>({
    resolver: zodResolver(addLineItemSchema),
    defaultValues: {
      inventoryItemId: '',
      orderedQuantity: '',
      unitPrice: '',
    },
  });

  const excludeIds = existingItemIds.join(',');

  // Pre-fill unit price from supplier pricelist when item is selected
  const watchedItemId = useWatch({ control: form.control, name: 'inventoryItemId' });

  useEffect(() => {
    if (!watchedItemId || !purchaseOrder.supplierId) {
      setResolvedUnitPrice(null);
      form.setValue('unitPrice', '');
      return;
    }

    let cancelled = false;
    setIsPriceLooking(true);

    getSupplierItemPrice(purchaseOrder.supplierId, watchedItemId)
      .then(({ unitPrice }) => {
        if (!cancelled) {
          setResolvedUnitPrice(unitPrice);
          form.setValue('unitPrice', unitPrice != null ? String(unitPrice) : '');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedUnitPrice(null);
          form.setValue('unitPrice', '');
        }
      })
      .finally(() => {
        if (!cancelled) setIsPriceLooking(false);
      });

    return () => {
      cancelled = true;
      setIsPriceLooking(false);
    };
  }, [watchedItemId, purchaseOrder.supplierId, form]);

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
        unitPrice: resolvedUnitPrice ?? undefined,
      })}
    >
      <InventoryItemSelector
        name="inventoryItemId"
        label="Inventory Item"
        placeholder="Select item"
        fieldKeys={{ valueKey: 'id', labelKey: 'name', additionalKeys: 'symbol', groupIdKey: 'categoryId' }}
        transformLabel={(label, option) => {
          const baseLabel = label.replace(/\s-\s[^-]+$/, '');
          const uom = option.additionals?.symbol;
          return typeof uom === 'string' && uom.trim() ? `${baseLabel} (${uom})` : baseLabel;
        }}
        params={{ excludeIds, supplierId: purchaseOrder.supplierId }}
      />
      <TextField name="orderedQuantity" label="Ordered Quantity" type="number" placeholder="e.g. 500" />
      <TextField
        name="unitPrice"
        label="Unit Price"
        type="number"
        placeholder={isPriceLooking ? 'Looking up price...' : 'No price set'}
        description="Read-only. Update this price from Supplier Items."
        readOnly
        disabled
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
