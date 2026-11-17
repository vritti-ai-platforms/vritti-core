import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { parse } from '@vritti/quantum-ui/date-fns';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { FreeQtyPreview } from '@/components/FreeQtyPreview';
import {
  type AddPurchaseOrderItemFormData,
  buildAddPurchaseOrderItemSchema,
  type PurchaseOrderDetail,
} from '@/schemas/purchase-orders';
import { InventoryItemSelector } from '@/selectors/inventory-item';
import { UomSelector } from '@/selectors/uom';
import { computeFreeQty } from '@/utils/freeQty';
import type { PurchaseOrdersBinding } from '../../../bindings';
import { ConversionPreview } from '../../../ConversionPreview';

interface AddPurchaseOrderItemDialogProps {
  binding: PurchaseOrdersBinding;
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

// Orders an item the order's site carries, in one of its units, priced as the supplier quotes it; the supplier's item
// for it at the site, when there is one, fills the unit, price, scheme and minimum order
export const AddPurchaseOrderItemDialog: React.FC<AddPurchaseOrderItemDialogProps> = ({
  binding,
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const mutation = binding.useAddItem({ onSuccess });

  const [allowDecimal, setAllowDecimal] = useState<boolean>(false);
  // The site's rules buy the picked item only in the units the legal entity set up as the supplier's items
  const [supplierUnitsOnly, setSupplierUnitsOnly] = useState<boolean>(false);
  const [itemCurrency, setItemCurrency] = useState<string>(purchaseOrder.currencyCode);
  const isForeign = itemCurrency !== purchaseOrder.currencyCode;
  const storedRate = purchaseOrder.conversionRates[itemCurrency];

  const schema = useMemo(() => buildAddPurchaseOrderItemSchema(purchaseOrder.orderDate), [purchaseOrder.orderDate]);
  const form = useForm<AddPurchaseOrderItemFormData>({
    resolver: zodResolver(schema),
    defaultValues: { uomQty: 0, hasScheme: false },
  });

  const [inventoryItemId, uomId, hasScheme, unitPrice, uomQty, enteredRate, schemeBuyQty, schemeFreeQty] = useWatch({
    control: form.control,
    name: [
      'inventoryItemId',
      'uomId',
      'hasScheme',
      'unitPrice',
      'uomQty',
      'conversionRate',
      'schemeBuyQty',
      'schemeFreeQty',
    ],
  });
  const { data: defaults } = binding.useItemDefaults(purchaseOrder.id, inventoryItemId, uomId);
  const minOrder = defaults?.minOrderQuantity ?? undefined;
  const belowMinOrder = minOrder != null && Number(uomQty) > 0 && Number(uomQty) < minOrder;
  const freeQtyPreview = computeFreeQty(uomQty, schemeBuyQty, schemeFreeQty, hasScheme);

  // Fills the supplier's unit when none is picked, then its price and scheme in that unit; a currency without a PO rate
  // asks for one
  useEffect(() => {
    if (!defaults) return;
    if (!form.getValues('uomId') && defaults.uomId) form.setValue('uomId', defaults.uomId);
    const currency = defaults.unitPrice?.currency ?? purchaseOrder.currencyCode;
    setItemCurrency(currency);
    const needsRate = currency !== purchaseOrder.currencyCode && !purchaseOrder.conversionRates[currency];
    form.setValue('rateCurrency', needsRate ? currency : undefined);
    form.resetField('conversionRate');
    if (defaults.unitPrice) form.setValue('unitPrice', defaults.unitPrice);
    else form.resetField('unitPrice');
    form.setValue('schemeBuyQty', defaults.schemeBuyQty ?? undefined);
    form.setValue('schemeFreeQty', defaults.schemeFreeQty ?? undefined);
    form.setValue('hasScheme', defaults.schemeBuyQty != null && defaults.schemeFreeQty != null);
  }, [defaults, form, purchaseOrder.currencyCode, purchaseOrder.conversionRates]);

  // A new item starts from the supplier's unit for it, its primary unit's decimals until a unit is picked, and only the
  // supplier's units where the site's rules require supplier items
  const handleItemSelect = (option: SelectOption | null) => {
    form.resetField('uomId');
    setAllowDecimal(option?.additionals?.allowDecimal === true);
    setSupplierUnitsOnly(option?.additionals?.supplierItemsRequired === true);
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
        uomId: data.uomId,
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
        description={`An item this order's site carries, priced in ${purchaseOrder.currencyCode} as of the order date; the supplier's own item for it fills the unit and price.`}
      >
        <InventoryItemSelector
          name="inventoryItemId"
          label="Item"
          atSiteId={purchaseOrder.siteId}
          supplierId={purchaseOrder.supplierId}
          onOptionSelect={handleItemSelect}
        />
        <UomSelector
          name="uomId"
          label="Unit"
          params={
            inventoryItemId
              ? { inventoryItemId, ...(supplierUnitsOnly ? { soldBySupplierId: purchaseOrder.supplierId } : {}) }
              : undefined
          }
          disabled={!inventoryItemId}
          onOptionSelect={(option) => setAllowDecimal(option?.additionals?.allowDecimal === true)}
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
