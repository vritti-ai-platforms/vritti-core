import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { FreeQtyPreview } from '@/components/FreeQtyPreview';
import { useUpdatePurchaseOrderItem } from '@/hooks/purchase-orders';
import {
  buildUpdatePurchaseOrderItemSchema,
  type PurchaseOrderItemData,
  type UpdatePurchaseOrderItemFormData,
} from '@/schemas/purchase-orders';
import { computeFreeQty } from '@/utils/freeQty';

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
  const schema = useMemo(
    () => buildUpdatePurchaseOrderItemSchema({ minQty: item.receivedQuantity }),
    [item.receivedQuantity],
  );
  const form = useForm<UpdatePurchaseOrderItemFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      uomQty: item.uomQty,
      unitPrice: item.unitPrice,
      schemeBuyQty: item.schemeBuyQty ?? undefined,
      schemeFreeQty: item.schemeFreeQty ?? undefined,
      hasScheme: item.hasScheme ?? false,
    },
  });
  const mutation = useUpdatePurchaseOrderItem({ onSuccess });
  const hasScheme = form.watch('hasScheme');
  const freeQtyPreview = computeFreeQty(
    form.watch('uomQty'),
    form.watch('schemeBuyQty'),
    form.watch('schemeFreeQty'),
    hasScheme,
  );

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
        schemeBuyQty: data.schemeBuyQty,
        schemeFreeQty: data.schemeFreeQty,
        hasScheme: data.hasScheme,
      })}
    >
      <FormSection title="Item">
        <div className="flex flex-col gap-4">
          {item.orderUomSymbol && (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">UOM</span>
              <span className="text-sm text-muted-foreground">{item.orderUomSymbol}</span>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField name="uomQty" label="Quantity" type="number" placeholder="e.g. 500" />
            <CurrencyField
              name="unitPrice"
              label="Unit Price"
              currencyCode={poCurrencyCode}
              placeholder="Enter unit price"
            />
            {hasScheme && <FreeQtyPreview value={freeQtyPreview} />}
          </div>
        </div>
      </FormSection>
      <FormSection title="Free Goods Scheme">
        <div className="flex flex-col gap-4">
          <Switch name="hasScheme" label="Free goods scheme" description="Supplier ships bonus units on this item." />
          {hasScheme && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <TextField name="schemeBuyQty" label="Buy Qty" type="number" integer positive />
              <TextField name="schemeFreeQty" label="Free Qty" type="number" integer positive />
            </div>
          )}
        </div>
      </FormSection>
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
