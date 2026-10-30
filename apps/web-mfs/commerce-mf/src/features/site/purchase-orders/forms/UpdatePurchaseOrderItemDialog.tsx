import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { FreeQtyPreview } from '@/components/FreeQtyPreview';
import { useUpdatePurchaseOrderItem } from '@/hooks/site/purchase-orders';
import {
  buildUpdatePurchaseOrderItemSchema,
  type PurchaseOrderItemData,
  type UpdatePurchaseOrderItemFormData,
} from '@/schemas/purchase-orders';
import { computeFreeQty } from '@/utils/freeQty';
import { ConversionPreview } from '../components/ConversionPreview';

interface UpdatePurchaseOrderItemDialogProps {
  purchaseOrderId: string;
  poCurrencyCode: string;
  // The PO's rates for the supplier's other currencies; a line quoted in one is edited as quoted
  conversionRates: Record<string, string>;
  item: PurchaseOrderItemData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const UpdatePurchaseOrderItemDialog: React.FC<UpdatePurchaseOrderItemDialogProps> = ({
  purchaseOrderId,
  poCurrencyCode,
  conversionRates,
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
      unitPrice: item.sourceUnitPrice ?? item.unitPrice,
      schemeBuyQty: item.schemeBuyQty ?? undefined,
      schemeFreeQty: item.schemeFreeQty ?? undefined,
      hasScheme: item.hasScheme ?? false,
    },
  });
  const mutation = useUpdatePurchaseOrderItem({ onSuccess });
  const hasScheme = form.watch('hasScheme');
  const unitPrice = form.watch('unitPrice');
  const sourceCurrency = item.sourceUnitPrice?.currency;
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
        unitPrice: data.unitPrice as CurrencyValue | undefined,
        schemeBuyQty: data.schemeBuyQty,
        schemeFreeQty: data.schemeFreeQty,
        hasScheme: data.hasScheme,
      })}
    >
      <FormSection title="Item" contentClassName="block">
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
              label={sourceCurrency ? `Unit Price (${sourceCurrency})` : 'Unit Price'}
              currencyCode={sourceCurrency ?? poCurrencyCode}
              placeholder="Enter unit price"
            />
            {sourceCurrency && (
              <ConversionPreview
                price={unitPrice as CurrencyValue | undefined}
                poCurrencyCode={poCurrencyCode}
                rate={conversionRates[sourceCurrency] ? Number(conversionRates[sourceCurrency]) : undefined}
              />
            )}
            {hasScheme && <FreeQtyPreview value={freeQtyPreview} />}
          </div>
        </div>
      </FormSection>
      <FormSection title="Free Goods Scheme" contentClassName="block">
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
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Updating...">
          Update Line Item
        </Button>
      </DialogActions>
    </Form>
  );
};
