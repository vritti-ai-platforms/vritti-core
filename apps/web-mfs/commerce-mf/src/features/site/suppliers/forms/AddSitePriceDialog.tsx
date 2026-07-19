import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddSiteSupplierItemPrice } from '@/hooks/site/suppliers';
import { type AddSupplierItemPriceFormData, addSupplierItemPriceSchema } from '@/schemas/suppliers';

interface AddSitePriceDialogProps {
  supplierId: string;
  itemId: string;
  currencyCode?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSitePriceDialog: React.FC<AddSitePriceDialogProps> = ({
  supplierId,
  itemId,
  currencyCode,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddSupplierItemPriceFormData>({
    resolver: zodResolver(addSupplierItemPriceSchema),
    defaultValues: {
      unitPrice: undefined,
      schemeBuyQty: undefined,
      schemeFreeQty: undefined,
      validFrom: '',
      validTo: '',
    },
  });

  const addMutation = useAddSiteSupplierItemPrice(supplierId, itemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        unitPrice: data.unitPrice,
        schemeBuyQty: data.schemeBuyQty ?? undefined,
        schemeFreeQty: data.schemeFreeQty ?? undefined,
        validFrom: data.validFrom,
        validTo: data.validTo || undefined,
      })}
    >
      <FormSection title="Site Price" contentClassName="block">
        <div className="flex flex-col gap-4">
          <CurrencyField name="unitPrice" label="Unit Price" currencyCode={currencyCode} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePicker name="validFrom" label="Valid From" />
            <DatePicker name="validTo" label="Valid To (optional)" />
          </div>
        </div>
      </FormSection>
      <FormSection title="Free Goods Scheme" contentClassName="block">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField name="schemeBuyQty" label="Buy Qty" type="number" integer positive placeholder="e.g. 9" />
          <TextField name="schemeFreeQty" label="Free Qty" type="number" integer positive placeholder="e.g. 1" />
        </div>
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Site Price
        </Button>
      </DialogActions>
    </Form>
  );
};
