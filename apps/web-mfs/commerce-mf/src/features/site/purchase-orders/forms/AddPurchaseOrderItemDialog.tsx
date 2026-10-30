import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { minorToMajor } from '@vritti/quantum-ui/money';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FreeQtyPreview } from '@/components/FreeQtyPreview';
import { useAddPurchaseOrderItem } from '@/hooks/site/purchase-orders';
import {
  type AddPurchaseOrderItemFormData,
  addPurchaseOrderItemSchema,
  type PurchaseOrderDetail,
} from '@/schemas/purchase-orders';
import { SupplierItemSelector } from '@/selectors/supplier-item';
import { computeFreeQty } from '@/utils/freeQty';
import { ConversionPreview } from '../components/ConversionPreview';

const toOptionalNumber = (raw: unknown): number | undefined => {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};

interface AddPurchaseOrderItemDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddPurchaseOrderItemDialog: React.FC<AddPurchaseOrderItemDialogProps> = ({
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const mutation = useAddPurchaseOrderItem({ onSuccess });

  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);
  // The supplier's minimum order for the picked item; a smaller quantity is allowed but flagged
  const [minOrder, setMinOrder] = useState<number | undefined>();
  // The supplier item's currency; a price in another than the PO's is converted at the PO's rate for it
  const [itemCurrency, setItemCurrency] = useState<string>(purchaseOrder.currencyCode);
  const isForeign = itemCurrency !== purchaseOrder.currencyCode;
  const storedRate = purchaseOrder.conversionRates[itemCurrency];

  const form = useForm<AddPurchaseOrderItemFormData>({
    resolver: zodResolver(addPurchaseOrderItemSchema),
    defaultValues: {
      uomQty: 0,
      unitPrice: undefined,
      schemeBuyQty: undefined,
      schemeFreeQty: undefined,
      hasScheme: false,
    },
  });

  const hasScheme = form.watch('hasScheme');
  const unitPrice = form.watch('unitPrice');
  const uomQty = form.watch('uomQty');
  const belowMinOrder = minOrder != null && Number(uomQty) > 0 && Number(uomQty) < minOrder;
  const enteredRate = form.watch('conversionRate');
  const freeQtyPreview = computeFreeQty(
    form.watch('uomQty'),
    form.watch('schemeBuyQty'),
    form.watch('schemeFreeQty'),
    hasScheme,
  );

  const handleItemSelect = (option: SelectOption | null) => {
    const rawMinor = option?.additionals?.unitPrice;
    const rawCurrency = option?.additionals?.currencyCode;
    const currency = typeof rawCurrency === 'string' ? rawCurrency : purchaseOrder.currencyCode;
    setAllowDecimal(option?.additionals?.allowDecimal === true);
    setMinOrder(toOptionalNumber(option?.additionals?.minOrderQuantity));
    setItemCurrency(currency);
    // The price is entered as the supplier quotes it; a currency the PO has no rate for asks for one
    const needsRate = currency !== purchaseOrder.currencyCode && !purchaseOrder.conversionRates[currency];
    form.setValue('rateCurrency', needsRate ? currency : undefined);
    form.resetField('conversionRate');
    if (rawMinor) {
      form.setValue('unitPrice', { currency, value: minorToMajor(rawMinor.toString(), currency) });
    } else {
      form.resetField('unitPrice');
    }
    // Prefill the scheme from the site's price in force; buyer can edit at PO time.
    form.setValue('schemeBuyQty', toOptionalNumber(option?.additionals?.schemeBuyQty));
    form.setValue('schemeFreeQty', toOptionalNumber(option?.additionals?.schemeFreeQty));
    form.setValue('hasScheme', option?.additionals?.hasScheme === true);
  };

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrder.id,
        supplierItemId: data.supplierItemId,
        uomQty: data.uomQty,
        unitPrice: data.unitPrice as CurrencyValue,
        conversionRate: data.rateCurrency ? data.conversionRate : undefined,
        schemeBuyQty: data.schemeBuyQty,
        schemeFreeQty: data.schemeFreeQty,
        hasScheme: data.hasScheme,
      })}
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <SupplierItemSelector
              name="supplierItemId"
              params={{ supplierId: purchaseOrder.supplierId, excludeOnPurchaseOrderId: purchaseOrder.id }}
              onOptionSelect={handleItemSelect}
            />
          </div>
          <TextField
            name="uomQty"
            label="Quantity"
            type="number"
            placeholder="e.g. 500"
            integer={!allowDecimal}
            positive
            description={
              minOrder == null
                ? undefined
                : belowMinOrder
                  ? `Below the supplier's minimum order of ${minOrder}`
                  : `Supplier's minimum order: ${minOrder}`
            }
          />
          <CurrencyField
            name="unitPrice"
            label={isForeign ? `Unit Price (${itemCurrency})` : 'Unit Price'}
            currencyCode={itemCurrency}
            placeholder="Enter unit price"
          />
          {isForeign && !storedRate && (
            <TextField
              name="conversionRate"
              label={`1 ${itemCurrency} in ${purchaseOrder.currencyCode}`}
              type="number"
              placeholder="e.g. 83.25"
              positive
              nonZero
              description={`Applies to every ${itemCurrency} line on this PO`}
            />
          )}
          {isForeign && (
            <ConversionPreview
              price={unitPrice as CurrencyValue | undefined}
              poCurrencyCode={purchaseOrder.currencyCode}
              rate={storedRate ? Number(storedRate) : enteredRate}
            />
          )}
          {hasScheme && <FreeQtyPreview value={freeQtyPreview} />}
        </div>
        <Switch name="hasScheme" label="Free goods scheme" description="Supplier ships bonus units on this item." />
        {hasScheme && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField name="schemeBuyQty" label="Buy Quantity" type="number" integer positive />
            <TextField name="schemeFreeQty" label="Free Quantity" type="number" integer positive />
          </div>
        )}
      </div>
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Line Item
        </Button>
      </DialogActions>
    </Form>
  );
};
