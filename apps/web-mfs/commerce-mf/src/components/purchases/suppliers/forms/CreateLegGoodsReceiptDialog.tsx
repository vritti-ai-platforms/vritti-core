import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DateTimePicker } from '@vritti/quantum-ui/DateTimePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useFormatters } from '@vritti/quantum-ui/hooks';
import { Select, type SelectOption } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  InboundDeliverySourceValues,
  type InboundDeliveryStatus,
  InboundDeliveryStatusValues,
} from '@/schemas/inbound-deliveries';
import {
  buildPurchaseLegGoodsReceiptSchema,
  type CreatedPurchaseLegGoodsReceipt,
  type PurchaseHeader,
  type PurchaseLeg,
  type PurchaseLegGoodsReceiptFormData,
  PurchaseTypeValues,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';

const CLOSED_DELIVERY_STATUSES: InboundDeliveryStatus[] = [
  InboundDeliveryStatusValues.RECEIVED,
  InboundDeliveryStatusValues.CANCELLED,
];

interface CreateLegGoodsReceiptDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseHeader;
  leg: PurchaseLeg;
  onSuccess: (received: CreatedPurchaseLegGoodsReceipt) => void;
  onCancel: () => void;
}

// Starts a draft goods receipt of the leg — of one of its inbound deliveries, or, where the leg allows it, of all
// its open confirmed lines — to be counted and posted in Goods Receipts
export const CreateLegGoodsReceiptDialog: React.FC<CreateLegGoodsReceiptDialogProps> = ({
  binding,
  purchase,
  leg,
  onSuccess,
  onCancel,
}) => {
  const fmt = useFormatters();
  const deliveryRequired = leg.type === PurchaseTypeValues.ANNOUNCED;
  const schema = useMemo(() => buildPurchaseLegGoodsReceiptSchema({ deliveryRequired }), [deliveryRequired]);
  const form = useForm<PurchaseLegGoodsReceiptFormData>({
    resolver: zodResolver(schema),
    defaultValues: { receivedDate: new Date().toISOString(), supplierDeliveryNoteNumber: '' },
  });
  const goodsReceiptMutation = binding.useCreateLegGoodsReceipt({ onSuccess: (response) => onSuccess(response.data) });

  const deliveryOptions = useMemo<SelectOption[]>(
    () =>
      leg.documents.deliveries
        .filter(
          (delivery) =>
            delivery.source === InboundDeliverySourceValues.ANNOUNCED &&
            delivery.receiptDraftId === null &&
            !CLOSED_DELIVERY_STATUSES.includes(delivery.status),
        )
        .map((delivery) => ({
          value: delivery.id,
          label: delivery.deliveryNumber,
          description: `Expected ${fmt.date(delivery.expectedDeliveryDate).primary}`,
        })),
    [leg.documents.deliveries, fmt],
  );

  return (
    <Form
      form={form}
      mutation={goodsReceiptMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchase.id,
        legId: leg.id,
        inboundDeliveryId: data.inboundDeliveryId,
        receivedDate: data.receivedDate,
        supplierDeliveryNoteNumber: data.supplierDeliveryNoteNumber.trim() || undefined,
        supplierDeliveryNoteDate: data.supplierDeliveryNoteDate || undefined,
      })}
    >
      <Select
        name="inboundDeliveryId"
        label={deliveryRequired ? 'Inbound Delivery' : 'Inbound Delivery (optional)'}
        placeholder={deliveryRequired ? 'Select an inbound delivery' : 'None — receive the open order lines'}
        options={deliveryOptions}
        clearable={!deliveryRequired}
        description={
          deliveryRequired
            ? 'Inbound deliveries of this supplier that are still open'
            : 'Leave empty to receive everything still open on the confirmed orders'
        }
      />
      <DateTimePicker name="receivedDate" label="Received" />
      <TextField name="supplierDeliveryNoteNumber" label="Delivery Note No. (optional)" />
      <DatePicker name="supplierDeliveryNoteDate" label="Delivery Note Date (optional)" />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Create Goods Receipt
        </Button>
      </DialogActions>
    </Form>
  );
};
