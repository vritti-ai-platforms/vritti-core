import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useWorkspaceTimeZone } from '@vritti/quantum-ui/hooks';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { isoTodayDate } from '@vritti/quantum-ui/timezone';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import type { GoodsReceiptData } from '@/schemas/goods-receipts';
import { type ReceiveInboundDeliveryFormData, receiveInboundDeliverySchema } from '@/schemas/inbound-deliveries';
import type { InboundDeliveryMutationsBinding } from '../bindings';

interface ReceiveInboundDeliveryDialogProps {
  mutations: InboundDeliveryMutationsBinding;
  deliveryId: string;
  onSuccess: (receipt: GoodsReceiptData) => void;
  onCancel: () => void;
}

// Starts a draft goods receipt pre-filled with what is still open on the delivery's lines
export const ReceiveInboundDeliveryDialog: React.FC<ReceiveInboundDeliveryDialogProps> = ({
  mutations,
  deliveryId,
  onSuccess,
  onCancel,
}) => {
  const timeZone = useWorkspaceTimeZone();
  const form = useForm<ReceiveInboundDeliveryFormData>({
    resolver: zodResolver(receiveInboundDeliverySchema),
    defaultValues: { receivedDate: isoTodayDate(timeZone), notes: '' },
  });
  const receiveMutation = mutations.useReceive({ onSuccess: (response) => onSuccess(response.data) });

  return (
    <Form
      form={form}
      mutation={receiveMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: deliveryId,
        receivedDate: data.receivedDate,
        notes: data.notes.trim() || null,
      })}
    >
      <DatePicker name="receivedDate" label="Received Date" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Draft Receipt
        </Button>
      </DialogActions>
    </Form>
  );
};
