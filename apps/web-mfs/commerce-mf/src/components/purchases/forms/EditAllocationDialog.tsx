import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { FreeQtyPreview } from '@/components/FreeQtyPreview';
import {
  type PurchaseAllocation,
  type PurchaseDetail,
  type PurchaseItem,
  type UpdatePurchaseAllocationFormData,
  updatePurchaseAllocationSchema,
} from '@/schemas/purchases';
import { UomSelector } from '@/selectors/uom';
import { computeFreeQty } from '@/utils/freeQty';
import type { PurchasesBinding } from '../bindings';

interface EditAllocationDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  item: Pick<PurchaseItem, 'inventoryItemId'>;
  allocation: PurchaseAllocation;
  onSuccess: () => void;
  onCancel: () => void;
}

// Changes an allocation's unit, quantity, price or scheme while its supplier's leg is in sourcing
export const EditAllocationDialog: React.FC<EditAllocationDialogProps> = ({
  binding,
  purchase,
  item,
  allocation,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdatePurchaseAllocationFormData>({
    resolver: zodResolver(updatePurchaseAllocationSchema),
    defaultValues: {
      uomId: allocation.uomId,
      uomQty: allocation.uomQty,
      unitPrice: allocation.isPriced ? allocation.unitPrice : undefined,
      hasScheme: allocation.hasScheme,
      schemeBuyQty: allocation.schemeBuyQty ?? undefined,
      schemeFreeQty: allocation.schemeFreeQty ?? undefined,
    },
  });
  const updateMutation = binding.useUpdateAllocation({ onSuccess });
  const [hasScheme, uomQty, schemeBuyQty, schemeFreeQty] = useWatch({
    control: form.control,
    name: ['hasScheme', 'uomQty', 'schemeBuyQty', 'schemeFreeQty'],
  });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchase.id,
        allocationId: allocation.id,
        uomId: data.uomId,
        uomQty: data.uomQty,
        unitPrice: data.unitPrice?.value ? data.unitPrice : null,
        schemeBuyQty: data.hasScheme ? data.schemeBuyQty : null,
        schemeFreeQty: data.hasScheme ? data.schemeFreeQty : null,
      })}
    >
      <FormSection title="Quantity & Price">
        <UomSelector name="uomId" label="Unit" params={{ inventoryItemId: item.inventoryItemId }} />
        <TextField name="uomQty" label="Quantity" type="number" positive nonZero />
        <CurrencyField
          name="unitPrice"
          label="Unit Price (optional)"
          currencyCode={allocation.unitPrice.currency}
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
        <Button type="submit" loadingText="Saving...">
          Save Allocation
        </Button>
      </DialogActions>
    </Form>
  );
};
