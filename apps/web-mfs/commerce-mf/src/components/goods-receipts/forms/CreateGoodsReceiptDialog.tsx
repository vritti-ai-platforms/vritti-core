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
import {
  type CreateGoodsReceiptFromDeliveryFormData,
  createGoodsReceiptFromDeliverySchema,
  type GoodsReceiptData,
} from '@/schemas/goods-receipts';
import { ReceivableInboundDeliverySelector } from '@/selectors/receivable-inbound-delivery';
import type { UseCreateGoodsReceiptFromDelivery } from '../types';

interface CreateGoodsReceiptDialogProps {
  useCreateFromDelivery: UseCreateGoodsReceiptFromDelivery;
  inboundDeliveryId?: string;
  onSuccess: (receipt: GoodsReceiptData) => void;
  onCancel: () => void;
}

// Starts a draft goods receipt of an announced inbound delivery, carrying what is still open on its lines; a delivery
// chosen on its own page comes preselected
export const CreateGoodsReceiptDialog: React.FC<CreateGoodsReceiptDialogProps> = ({
  useCreateFromDelivery,
  inboundDeliveryId,
  onSuccess,
  onCancel,
}) => {
  const timeZone = useWorkspaceTimeZone();
  const form = useForm<CreateGoodsReceiptFromDeliveryFormData>({
    resolver: zodResolver(createGoodsReceiptFromDeliverySchema),
    defaultValues: { inboundDeliveryId, receivedDate: isoTodayDate(timeZone), notes: '' },
  });
  const mutation = useCreateFromDelivery({ onSuccess: (response) => onSuccess(response.data) });

  return (
    <Form
      form={form}
      mutation={mutation}
      transformSubmit={(data) => ({ ...data, notes: data.notes.trim() || undefined })}
      onCancel={onCancel}
    >
      <ReceivableInboundDeliverySelector
        name="inboundDeliveryId"
        description="Announced deliveries that are still open, have no draft receipt and carry lines of confirmed orders"
      />
      <DatePicker name="receivedDate" label="Received Date" />
      <TextArea name="notes" label="Notes" placeholder="Optional notes" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Draft
        </Button>
      </DialogActions>
    </Form>
  );
};
