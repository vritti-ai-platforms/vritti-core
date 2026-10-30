import { Alert } from '@vritti/quantum-ui/Alert';
import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { usePermission } from '@vritti/quantum-ui/PermissionGate';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  type SupplierItemPriceRow,
  type UpdateSupplierItemPriceFormData,
  updateSupplierItemPriceSchema,
} from '@/schemas/suppliers';
import { CurrencySelector } from '@/selectors/currency';
import { InventoryItemMrpSelector } from '@/selectors/inventory-item-mrp';
import { isPriceInForce } from '@/utils/supplierPrice';
import type { SupplierSiteBinding } from '../bindings';
import type { SupplierSiteRef } from '../types';

interface EditSitePriceDialogProps {
  binding: SupplierSiteBinding;
  supplierRef: SupplierSiteRef;
  itemId: string;
  inventoryItemId: string;
  uomId: string;
  // Every currency the supplier trades in; the price starts in its own
  currencyCodes: string[];
  price: SupplierItemPriceRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditSitePriceDialog: React.FC<EditSitePriceDialogProps> = ({
  binding,
  supplierRef,
  itemId,
  inventoryItemId,
  uomId,
  currencyCodes,
  price,
  onSuccess,
  onCancel,
}) => {
  const inForce = isPriceInForce(price);
  const form = useForm<UpdateSupplierItemPriceFormData>({
    resolver: zodResolver(updateSupplierItemPriceSchema),
    defaultValues: {
      unitPrice: price.unitPrice,
      mrpId: price.mrpId ?? undefined,
      schemeBuyQty: price.schemeBuyQty ?? undefined,
      schemeFreeQty: price.schemeFreeQty ?? undefined,
      taxInclusive: price.taxInclusive,
      validTo: price.validTo ?? '',
    },
  });

  // A price is in one of the supplier's currencies; switching keeps the amount and drops an MRP printed in the old one
  const [currency, setCurrency] = useState(price.unitPrice.currency);
  const changeCurrency = (next: string) => {
    setCurrency(next);
    const unitPrice = form.getValues('unitPrice');
    if (unitPrice) form.setValue('unitPrice', { ...unitPrice, currency: next });
    form.setValue('mrpId', undefined);
  };

  const updateMutation = binding.useUpdateSitePrice(supplierRef, itemId, { onSuccess });
  const canSetMrp = usePermission(binding.permissions.mrp.edit).available;

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        priceId: price.id,
        data: inForce
          ? { validTo: data.validTo || null }
          : {
              unitPrice: data.unitPrice,
              ...(canSetMrp ? { mrpId: data.mrpId ?? null } : {}),
              schemeBuyQty: data.schemeBuyQty ?? null,
              schemeFreeQty: data.schemeFreeQty ?? null,
              taxInclusive: data.taxInclusive,
              validTo: data.validTo || null,
            },
      })}
    >
      {inForce && (
        <Alert
          variant="info"
          title="Price in force"
          description="This price has taken effect, so only its end date can change. Add a new price to change the terms."
        />
      )}
      <FormSection title="Price" contentClassName="block">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CurrencySelector
              label="Currency"
              includeCodes={currencyCodes}
              clearable={false}
              disabled={inForce || currencyCodes.length < 2}
              value={currency}
              onChange={(next: unknown) => next && changeCurrency(String(next))}
              description="One of the supplier's currencies"
            />
            <CurrencyField name="unitPrice" label="Unit Price" currencyCode={currency} disabled={inForce} />
            <InventoryItemMrpSelector
              name="mrpId"
              permission={binding.permissions.mrp.edit}
              label="MRP (optional)"
              placeholder="Select MRP"
              inventoryItemId={inventoryItemId}
              uomId={uomId}
              currencyCode={currency}
              disabled={inForce}
            />
          </div>
          <DatePicker name="validTo" label="Valid To (optional)" minDate={new Date(price.validFrom)} />
          <Switch
            name="taxInclusive"
            label="Price includes tax"
            description="On = the supplier quotes tax-inclusive; off = tax is added on top"
            disabled={inForce}
          />
        </div>
      </FormSection>
      <FormSection title="Free Goods Scheme" contentClassName="block">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            name="schemeBuyQty"
            label="Buy Qty"
            type="number"
            integer
            positive
            placeholder="e.g. 9"
            disabled={inForce}
          />
          <TextField
            name="schemeFreeQty"
            label="Free Qty"
            type="number"
            integer
            positive
            placeholder="e.g. 1"
            disabled={inForce}
          />
        </div>
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
