import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { parse } from '@vritti/quantum-ui/date-fns';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { minorToMajor } from '@vritti/quantum-ui/money';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FreeQtyPreview } from '@/components/FreeQtyPreview';
import {
  type AddPurchaseOrderItemFormData,
  buildAddPurchaseOrderItemSchema,
  type PurchaseOrderDetail,
} from '@/schemas/purchase-orders';
import { SupplierItemSelector } from '@/selectors/supplier-item';
import { computeFreeQty } from '@/utils/freeQty';
import type { PurchaseOrdersBinding } from '../../../bindings';
import { ConversionPreview } from '../../../ConversionPreview';

// Reads an optional number from a select option's additionals
function toOptionalNumber(raw: unknown): number | undefined {
  if (raw == null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

interface AddPurchaseOrderItemDialogProps {
  binding: PurchaseOrdersBinding;
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

// Orders one of the supplier's items, priced as the supplier quotes it and prefilled from the price in force
export const AddPurchaseOrderItemDialog: React.FC<AddPurchaseOrderItemDialogProps> = ({
  binding,
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const mutation = binding.useAddItem({ onSuccess });

  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);
  const [minOrder, setMinOrder] = useState<number | undefined>();
  const [itemCurrency, setItemCurrency] = useState<string>(purchaseOrder.currencyCode);
  const isForeign = itemCurrency !== purchaseOrder.currencyCode;
  const storedRate = purchaseOrder.conversionRates[itemCurrency];

  const schema = useMemo(() => buildAddPurchaseOrderItemSchema(purchaseOrder.orderDate), [purchaseOrder.orderDate]);
  const form = useForm<AddPurchaseOrderItemFormData>({
    resolver: zodResolver(schema),
    defaultValues: { uomQty: 0, hasScheme: false },
  });

  const hasScheme = form.watch('hasScheme');
  const unitPrice = form.watch('unitPrice');
  const uomQty = form.watch('uomQty');
  const belowMinOrder = minOrder != null && Number(uomQty) > 0 && Number(uomQty) < minOrder;
  const enteredRate = form.watch('conversionRate');
  const freeQtyPreview = computeFreeQty(uomQty, form.watch('schemeBuyQty'), form.watch('schemeFreeQty'), hasScheme);

  // Prefills the price, scheme and minimum order from the picked supplier item; a currency without a PO rate asks for one
  const handleItemSelect = (option: SelectOption | null) => {
    const rawMinor = option?.additionals?.unitPrice;
    const rawCurrency = option?.additionals?.currencyCode;
    const currency = typeof rawCurrency === 'string' ? rawCurrency : purchaseOrder.currencyCode;
    setAllowDecimal(option?.additionals?.allowDecimal === true);
    setMinOrder(toOptionalNumber(option?.additionals?.minOrderQuantity));
    setItemCurrency(currency);
    const needsRate = currency !== purchaseOrder.currencyCode && !purchaseOrder.conversionRates[currency];
    form.setValue('rateCurrency', needsRate ? currency : undefined);
    form.resetField('conversionRate');
    if (rawMinor) {
      form.setValue('unitPrice', { currency, value: minorToMajor(rawMinor.toString(), currency) });
    } else {
      form.resetField('unitPrice');
    }
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
        expectedDeliveryDate: data.expectedDeliveryDate || undefined,
      })}
    >
      <FormSection
        title="Item"
        description={`The supplier's items set up at this order's site, priced in ${purchaseOrder.currencyCode} as of the order date.`}
        contentClassName="block"
      >
        <SupplierItemSelector
          name="supplierItemId"
          params={{ supplierId: purchaseOrder.supplierId, purchaseOrderId: purchaseOrder.id }}
          onOptionSelect={handleItemSelect}
        />
      </FormSection>

      <FormSection title="Quantity & Price">
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
            price={unitPrice}
            poCurrencyCode={purchaseOrder.currencyCode}
            rate={storedRate ? Number(storedRate) : enteredRate}
          />
        )}
      </FormSection>

      <FormSection
        title="Delivery"
        description="Leave it empty for the order date plus the item's lead time at the site."
      >
        <DatePicker
          name="expectedDeliveryDate"
          label="Expected Delivery"
          placeholder="From the item's lead time"
          minDate={parse(purchaseOrder.orderDate, 'yyyy-MM-dd', new Date())}
        />
      </FormSection>

      <FormSection title="Free Goods Scheme" contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3">
          <Switch name="hasScheme" label="Free goods scheme" description="Supplier ships bonus units on this item." />
        </div>
        {hasScheme && (
          <>
            <TextField name="schemeBuyQty" label="Buy" type="number" integer positive placeholder="e.g. 9" />
            <TextField name="schemeFreeQty" label="Get Free" type="number" integer positive placeholder="e.g. 1" />
            <FreeQtyPreview value={freeQtyPreview} />
          </>
        )}
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Line Item
        </Button>
      </DialogActions>
    </Form>
  );
};
