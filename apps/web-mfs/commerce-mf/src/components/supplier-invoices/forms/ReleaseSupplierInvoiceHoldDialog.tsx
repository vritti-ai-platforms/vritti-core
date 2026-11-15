import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type ReleaseSupplierInvoiceHoldFormData,
  releaseSupplierInvoiceHoldSchema,
  type SupplierInvoice,
  type SupplierInvoiceHold,
} from '@/schemas/supplier-invoices';
import type { SupplierInvoicesBinding } from '../bindings';

interface ReleaseSupplierInvoiceHoldDialogProps {
  binding: SupplierInvoicesBinding;
  invoice: SupplierInvoice;
  hold: SupplierInvoiceHold;
  onSuccess: () => void;
  onCancel: () => void;
}

// Releases an open hold, recording why it may be paid regardless; the hold reopens if what it found changes
export const ReleaseSupplierInvoiceHoldDialog: React.FC<ReleaseSupplierInvoiceHoldDialogProps> = ({
  binding,
  invoice,
  hold,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<ReleaseSupplierInvoiceHoldFormData>({
    resolver: zodResolver(releaseSupplierInvoiceHoldSchema),
    defaultValues: { reason: '' },
  });
  const releaseMutation = binding.useReleaseHold({ onSuccess });

  return (
    <Form
      form={form}
      mutation={releaseMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ invoice, holdId: hold.id, reason: data.reason })}
    >
      <TextArea
        name="reason"
        label="Reason"
        placeholder="e.g. Price agreed with the supplier by phone on 10 Nov"
        description="Kept on the hold for the audit trail"
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Releasing...">
          Release Hold
        </Button>
      </DialogActions>
    </Form>
  );
};
