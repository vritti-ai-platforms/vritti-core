import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateSupplierQuotation, useUpdateSupplierQuotation } from '@/hooks/legal-entity/supplier-quotations';
import {
  type SupplierQuotationData,
  type SupplierQuotationFormData,
  supplierQuotationSchema,
} from '@/schemas/supplier-quotations';
import { CurrencySelector } from '@/selectors/currency';

interface SupplierQuotationDialogProps {
  supplierId: string;
  // The supplier's default currency and every currency it trades in
  currencyCode: string;
  currencyCodes: string[];
  // Edits this quotation's header; without it the dialog records a new draft
  quotation?: SupplierQuotationData;
  onSuccess: (quotation?: SupplierQuotationData) => void;
  onCancel: () => void;
}

export const SupplierQuotationDialog: React.FC<SupplierQuotationDialogProps> = ({
  supplierId,
  currencyCode,
  currencyCodes,
  quotation,
  onSuccess,
  onCancel,
}) => {
  const posted = quotation?.status === 'POSTED';
  // The lines are priced in the quotation's currency, so it is fixed once there are any
  const currencyLocked = posted || (quotation?.itemCount ?? 0) > 0;
  const form = useForm<SupplierQuotationFormData>({
    resolver: zodResolver(supplierQuotationSchema),
    defaultValues: quotation
      ? {
          quotationNumber: quotation.quotationNumber,
          quotationDate: quotation.quotationDate,
          currencyCode: quotation.currencyCode,
          validFrom: quotation.validFrom,
          validTo: quotation.validTo,
          note: quotation.note ?? '',
        }
      : { quotationNumber: '', currencyCode, note: '' },
  });

  const createMutation = useCreateSupplierQuotation(supplierId, { onSuccess: (created) => onSuccess(created) });
  const updateMutation = useUpdateSupplierQuotation(supplierId, quotation?.id ?? '', { onSuccess: () => onSuccess() });

  const toPayload = (data: SupplierQuotationFormData) => ({
    quotationNumber: data.quotationNumber,
    quotationDate: data.quotationDate,
    currencyCode: data.currencyCode,
    validFrom: data.validFrom,
    validTo: data.validTo || null,
    note: data.note || null,
  });

  const body = (
    <>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField name="quotationNumber" label="Quotation Number" placeholder="e.g. SBD-Q-0411" />
          <DatePicker name="quotationDate" label="Quotation Date" />
        </div>
        <CurrencySelector
          name="currencyCode"
          includeCodes={currencyCodes}
          disabled={currencyLocked || currencyCodes.length < 2}
          description={currencyLocked ? 'Fixed once the quotation has lines' : "Every line's price and MRP is in it"}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DatePicker
            name="validFrom"
            label="Valid From"
            disabled={posted}
            description={posted ? 'Fixed once posted to a site' : 'First day the prices apply'}
          />
          <DatePicker
            name="validTo"
            label="Valid To (optional)"
            disabled={posted}
            description={posted ? 'Fixed once posted to a site' : 'Leave empty for no end date'}
          />
        </div>
        <TextArea name="note" label="Note (optional)" placeholder="e.g. Negotiated terms, contact" />
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          {quotation ? 'Save Changes' : 'Create Quotation'}
        </Button>
      </DialogActions>
    </>
  );

  return quotation ? (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => {
        const { validFrom, validTo, currencyCode: currency, ...rest } = toPayload(data);
        return {
          ...rest,
          ...(posted ? {} : { validFrom, validTo }),
          ...(currencyLocked ? {} : { currencyCode: currency }),
        };
      }}
    >
      {body}
    </Form>
  ) : (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel} transformSubmit={toPayload}>
      {body}
    </Form>
  );
};
