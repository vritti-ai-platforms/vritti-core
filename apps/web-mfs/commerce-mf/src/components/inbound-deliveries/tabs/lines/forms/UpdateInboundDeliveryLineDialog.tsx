import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  buildUpdateInboundDeliveryLineSchema,
  type InboundDeliveryLineData,
  type UpdateInboundDeliveryLineFormData,
} from '@/schemas/inbound-deliveries';
import type { InboundDeliveryMutationsBinding } from '../../../bindings';

interface UpdateInboundDeliveryLineDialogProps {
  mutations: InboundDeliveryMutationsBinding;
  line: InboundDeliveryLineData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Changes how much of a purchase order line comes on the delivery, between what was received against it and what is open
export const UpdateInboundDeliveryLineDialog: React.FC<UpdateInboundDeliveryLineDialogProps> = ({
  mutations,
  line,
  onSuccess,
  onCancel,
}) => {
  const schema = useMemo(
    () =>
      buildUpdateInboundDeliveryLineSchema({
        min: line.receivedOnDeliveryQty,
        max: line.maxQuantity,
        allowDecimal: line.allowDecimal,
      }),
    [line.receivedOnDeliveryQty, line.maxQuantity, line.allowDecimal],
  );
  const form = useForm<UpdateInboundDeliveryLineFormData>({
    resolver: zodResolver(schema),
    defaultValues: { quantity: line.quantity },
  });
  const updateMutation = mutations.useUpdateLine({ onSuccess });
  const unit = line.uomSymbol ? ` ${line.uomSymbol}` : '';

  return (
    <Form
      form={form}
      mutation={updateMutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: line.inboundDeliveryId, lineId: line.id, quantity: data.quantity })}
    >
      <TextField
        name="quantity"
        label={`Quantity${unit}`}
        type="number"
        integer={!line.allowDecimal}
        positive
        description={
          line.receivedOnDeliveryQty > 0
            ? `Between ${line.receivedOnDeliveryQty}${unit} already received on this delivery and ${line.maxQuantity}${unit}`
            : `At most ${line.maxQuantity}${unit}`
        }
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Quantity
        </Button>
      </DialogActions>
    </Form>
  );
};
