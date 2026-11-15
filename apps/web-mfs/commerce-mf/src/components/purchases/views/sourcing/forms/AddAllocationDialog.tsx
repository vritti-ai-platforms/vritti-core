import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import type { SelectOption } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { FreeQtyPreview } from '@/components/FreeQtyPreview';
import {
  type AddPurchaseAllocationFormData,
  addPurchaseAllocationSchema,
  type PurchaseHeader,
  type PurchaseItem,
} from '@/schemas/purchases';
import { UomSelector } from '@/selectors/uom';
import { computeFreeQty } from '@/utils/freeQty';
import type { PurchasesBinding } from '../../../bindings';

interface AddAllocationDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  item: PurchaseItem;
  onSuccess: () => void;
  onCancel: () => void;
}

// The currencies a picked supplier trades in, its default first
function supplierCurrencies(option: SelectOption | null): string[] {
  const codes = option?.additionals?.currencyCodes;
  const defaultCode = option?.additionals?.currencyCode;
  const all = Array.isArray(codes) ? codes.map(String) : [];
  return typeof defaultCode === 'string' ? [defaultCode, ...all.filter((code) => code !== defaultCode)] : all;
}

// Allocates part of an item to a supplier in an ordering unit, opening the supplier's leg with its first allocation;
// the price may be left empty for a direct purchase, where the supplier invoice sets it
export const AddAllocationDialog: React.FC<AddAllocationDialogProps> = ({
  binding,
  purchase,
  item,
  onSuccess,
  onCancel,
}) => {
  const { SupplierSelector } = binding;
  const [currencies, setCurrencies] = useState<string[]>([]);
  const form = useForm<AddPurchaseAllocationFormData>({
    resolver: zodResolver(addPurchaseAllocationSchema),
    defaultValues: { hasScheme: false },
  });
  const addMutation = binding.useAddAllocation({ onSuccess });
  const [hasScheme, uomQty, schemeBuyQty, schemeFreeQty] = useWatch({
    control: form.control,
    name: ['hasScheme', 'uomQty', 'schemeBuyQty', 'schemeFreeQty'],
  });

  // A new supplier offers its own currencies and clears a price entered in another one
  const handleSupplierSelect = (option: SelectOption | null) => {
    setCurrencies(supplierCurrencies(option));
    form.resetField('unitPrice');
  };

  return (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchase.id,
        purchaseItemId: item.id,
        supplierId: data.supplierId,
        uomId: data.uomId,
        uomQty: data.uomQty,
        unitPrice: data.unitPrice?.value ? data.unitPrice : undefined,
        schemeBuyQty: data.hasScheme ? data.schemeBuyQty : undefined,
        schemeFreeQty: data.hasScheme ? data.schemeFreeQty : undefined,
      })}
    >
      <FormSection title="Supplier" contentClassName="block">
        <SupplierSelector
          name="supplierId"
          description="A supplier enrolled at the purchase's site"
          params={binding.supplierParams?.(purchase.siteId)}
          onOptionSelect={handleSupplierSelect}
        />
      </FormSection>
      <FormSection title="Quantity & Price">
        <UomSelector name="uomId" label="Unit" params={{ inventoryItemId: item.inventoryItemId }} />
        <TextField name="uomQty" label="Quantity" type="number" positive nonZero />
        <CurrencyField
          name="unitPrice"
          label="Unit Price (optional)"
          currencies={currencies}
          defaultCurrencyCode={currencies[0]}
          description="Leave empty for a direct purchase — the supplier invoice sets it"
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
            <FreeQtyPreview value={computeFreeQty(uomQty, schemeBuyQty, schemeFreeQty, hasScheme)} />
          </>
        )}
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Allocating...">
          Allocate
        </Button>
      </DialogActions>
    </Form>
  );
};
