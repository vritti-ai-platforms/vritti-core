import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useWorkspaceTimeZone } from '@vritti/quantum-ui/hooks';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { isoTodayDate } from '@vritti/quantum-ui/timezone';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type CreateInboundDeliveryFormData,
  createInboundDeliverySchema,
  type InboundDeliveryData,
} from '@/schemas/inbound-deliveries';
import type { InboundDeliveryMutationsBinding } from '../bindings';

interface CreateInboundDeliveryDialogProps {
  mutations: InboundDeliveryMutationsBinding;
  onSuccess: (delivery: InboundDeliveryData) => void;
  onCancel: () => void;
}

// Announces a delivery from one of the suppliers enrolled at the site; its lines are added on the delivery
export const CreateInboundDeliveryDialog: React.FC<CreateInboundDeliveryDialogProps> = ({
  mutations,
  onSuccess,
  onCancel,
}) => {
  const { SupplierSelector } = mutations;
  const timeZone = useWorkspaceTimeZone();
  const form = useForm<CreateInboundDeliveryFormData>({
    resolver: zodResolver(createInboundDeliverySchema),
    defaultValues: {
      expectedDeliveryDate: isoTodayDate(timeZone),
      carrier: '',
      trackingNumber: '',
      supplierDeliveryNoteNumber: '',
      notes: '',
    },
  });
  const createMutation = mutations.useCreate({ onSuccess: (response) => onSuccess(response.data) });

  return (
    <Form
      form={form}
      mutation={createMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierId: data.supplierId,
        expectedDeliveryDate: data.expectedDeliveryDate,
        carrier: data.carrier.trim() || null,
        trackingNumber: data.trackingNumber.trim() || null,
        supplierDeliveryNoteNumber: data.supplierDeliveryNoteNumber.trim() || null,
        supplierDeliveryNoteDate: data.supplierDeliveryNoteDate || null,
        notes: data.notes.trim() || null,
      })}
    >
      <SupplierSelector name="supplierId" />
      <DatePicker name="expectedDeliveryDate" label="Expected Delivery Date" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField name="carrier" label="Carrier" placeholder="Optional carrier" />
        <TextField name="trackingNumber" label="Tracking Number" placeholder="Optional tracking number" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          name="supplierDeliveryNoteNumber"
          label="Supplier Delivery Note No."
          placeholder="Optional challan number"
        />
        <DatePicker name="supplierDeliveryNoteDate" label="Delivery Note Date" />
      </div>
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Delivery
        </Button>
      </DialogActions>
    </Form>
  );
};
