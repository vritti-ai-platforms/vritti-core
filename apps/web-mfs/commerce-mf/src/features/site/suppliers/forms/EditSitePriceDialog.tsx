import { Button } from '@vritti/quantum-ui/Button';
import { CurrencyField } from '@vritti/quantum-ui/CurrencyField';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateSiteSupplierItemPrice } from '@/hooks/site/suppliers';
import {
  type SupplierItemPriceRow,
  type UpdateSupplierItemPriceFormData,
  updateSupplierItemPriceSchema,
} from '@/schemas/suppliers';

interface EditSitePriceDialogProps {
  supplierId: string;
  itemId: string;
  currencyCode?: string;
  price: SupplierItemPriceRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditSitePriceDialog: React.FC<EditSitePriceDialogProps> = ({
  supplierId,
  itemId,
  currencyCode,
  price,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateSupplierItemPriceFormData>({
    resolver: zodResolver(updateSupplierItemPriceSchema),
    defaultValues: {
      unitPrice: price.unitPrice,
      schemeBuyQty: price.schemeBuyQty ?? undefined,
      schemeFreeQty: price.schemeFreeQty ?? undefined,
      validTo: price.validTo ?? '',
    },
  });

  const updateMutation = useUpdateSiteSupplierItemPrice(supplierId, itemId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        priceId: price.id,
        data: {
          unitPrice: data.unitPrice,
          schemeBuyQty: data.schemeBuyQty ?? undefined,
          schemeFreeQty: data.schemeFreeQty ?? undefined,
          validTo: data.validTo || null,
        },
      })}
    >
      <FormSection title="Site Price" contentClassName="block">
        <div className="flex flex-col gap-4">
          <CurrencyField name="unitPrice" label="Unit Price" currencyCode={currencyCode} />
          <DatePicker name="validTo" label="Valid To (optional)" />
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
