import { LE_INVENTORY_ITEMS } from '@vritti/commerce-permissions/inventory-items';
import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useAddSupplierItemPrice } from '@/hooks/legal-entity/suppliers';
import { type AddLeSupplierItemPriceFormData, addLeSupplierItemPriceSchema } from '@/schemas/suppliers';
import { InventoryItemMrpSelector } from '@/selectors/inventory-item-mrp';
import { SupplierSiteItemSelector } from '@/selectors/supplier-site-item';

interface AddSupplierItemPriceDialogProps {
  supplierId: string;
  itemId: string;
  inventoryItemId: string;
  uomId: string;
  // The supplier's default currency and every currency a price may be in
  currencyCode: string;
  currencyCodes: string[];
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierItemPriceDialog: React.FC<AddSupplierItemPriceDialogProps> = ({
  supplierId,
  itemId,
  inventoryItemId,
  uomId,
  currencyCode,
  currencyCodes,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddLeSupplierItemPriceFormData>({
    resolver: zodResolver(addLeSupplierItemPriceSchema),
    defaultValues: {
      siteIds: [],
      taxInclusive: false,
      note: '',
    },
  });

  // A price is in one of the supplier's currencies; switching drops an MRP printed in the old one
  const currency = useWatch({ control: form.control, name: 'unitPrice' })?.currency ?? currencyCode;
  const previousCurrency = useRef(currency);
  useEffect(() => {
    if (currency === previousCurrency.current) return;
    previousCurrency.current = currency;
    form.resetField('mrpId');
  }, [currency, form]);

  const addMutation = useAddSupplierItemPrice(supplierId, itemId, { onSuccess });
  const canSetMrp = usePermission(LE_INVENTORY_ITEMS.mrp.edit).available;

  return (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        siteIds: data.siteIds,
        unitPrice: data.unitPrice,
        mrpId: canSetMrp ? data.mrpId : undefined,
        schemeBuyQty: data.schemeBuyQty ?? undefined,
        schemeFreeQty: data.schemeFreeQty ?? undefined,
        taxInclusive: data.taxInclusive,
        validFrom: data.validFrom,
        validTo: data.validTo,
        note: data.note || undefined,
      })}
    >
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormSection title="Price" contentClassName="flex flex-col gap-4">
          <SupplierSiteItemSelector
            name="siteIds"
            supplierId={supplierId}
            itemId={itemId}
            multiple
            placeholder="All sites"
            description="Leave empty to price it for all sites; a site picked here gets a price of its own"
          />
          <CurrencyField
            name="unitPrice"
            label="Unit Price"
            currencies={currencyCodes}
            defaultCurrencyCode={currencyCode}
            description="In one of the supplier's currencies"
          />
          <InventoryItemMrpSelector
            name="mrpId"
            permission={LE_INVENTORY_ITEMS.mrp.edit}
            label="MRP (optional)"
            placeholder="Select MRP"
            inventoryItemId={inventoryItemId}
            uomId={uomId}
            currencyCode={currency}
          />
          <Switch
            name="taxInclusive"
            label="Price includes tax"
            description="On = the supplier quotes tax-inclusive; off = tax is added on top"
          />
        </FormSection>

        <div className="flex flex-col gap-6">
          <FormSection title="Validity">
            <DatePicker name="validFrom" label="Valid From" />
            <DatePicker name="validTo" label="Valid To (optional)" />
          </FormSection>
          <FormSection title="Free Goods Scheme">
            <TextField name="schemeBuyQty" label="Buy Qty" type="number" integer positive placeholder="e.g. 9" />
            <TextField name="schemeFreeQty" label="Free Qty" type="number" integer positive placeholder="e.g. 1" />
          </FormSection>
          <FormSection title="Note" contentClassName="block">
            <TextArea name="note" label="Note (optional)" placeholder="e.g. Quotation ref, negotiated terms" />
          </FormSection>
        </div>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Price
        </Button>
      </DialogActions>
    </Form>
  );
};
