import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type InboundDeliveryData,
  type UpdateInboundDeliveryFormData,
  updateInboundDeliverySchema,
} from '@/schemas/inbound-deliveries';
import type { InboundDeliveryMutationsBinding } from '../bindings';

interface UpdateInboundDeliveryDialogProps {
  mutations: InboundDeliveryMutationsBinding;
  delivery: InboundDeliveryData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Edits when the delivery is expected, how it travels and the supplier's delivery note; clearing a field removes it
export const UpdateInboundDeliveryDialog: React.FC<UpdateInboundDeliveryDialogProps> = ({
  mutations,
  delivery,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateInboundDeliveryFormData>({
    resolver: zodResolver(updateInboundDeliverySchema),
    defaultValues: {
      expectedDeliveryDate: delivery.expectedDeliveryDate,
      carrier: delivery.carrier ?? '',
      trackingNumber: delivery.trackingNumber ?? '',
      supplierDeliveryNoteNumber: delivery.supplierDeliveryNoteNumber ?? '',
      supplierDeliveryNoteDate: delivery.supplierDeliveryNoteDate,
      notes: delivery.notes ?? '',
    },
  });
  const updateMutation = mutations.useUpdate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: delivery.id,
        expectedDeliveryDate: data.expectedDeliveryDate,
        carrier: data.carrier.trim() || null,
        trackingNumber: data.trackingNumber.trim() || null,
        supplierDeliveryNoteNumber: data.supplierDeliveryNoteNumber.trim() || null,
        supplierDeliveryNoteDate: data.supplierDeliveryNoteDate || null,
        notes: data.notes.trim() || null,
      })}
    >
      <DatePicker
        name="expectedDeliveryDate"
        label="Expected Delivery Date"
        description="The purchase order lines on this delivery are expected on it too"
      />
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
