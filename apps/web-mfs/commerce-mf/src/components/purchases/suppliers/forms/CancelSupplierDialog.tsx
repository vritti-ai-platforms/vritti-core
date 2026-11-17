import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { RadioGroup } from '@vritti/quantum-ui/RadioGroup';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  CancelledQuantityValues,
  type CancelPurchaseLegFormData,
  cancelPurchaseLegSchema,
  type PurchaseDetail,
  type PurchaseLeg,
} from '@/schemas/purchases';
import type { PurchasesBinding } from '../../bindings';

interface CancelSupplierDialogProps {
  binding: PurchasesBinding;
  purchase: PurchaseDetail;
  leg: Pick<PurchaseLeg, 'id' | 'supplierName'>;
  onSuccess: () => void;
  onCancel: () => void;
}

const QUANTITY_OPTIONS = [
  {
    value: CancelledQuantityValues.RETURN,
    label: 'Source it again',
    description: 'The quantity goes back to Not allocated, to allocate to another supplier.',
  },
  {
    value: CancelledQuantityValues.DROP,
    label: 'No longer needed',
    description: "The items' quantities are lowered by it.",
  },
];

// Cancels a supplier with its orders and planned deliveries, choosing whether its quantity is sourced again or
// dropped, with the reason saved on it
export const CancelSupplierDialog: React.FC<CancelSupplierDialogProps> = ({
  binding,
  purchase,
  leg,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<CancelPurchaseLegFormData>({
    resolver: zodResolver(cancelPurchaseLegSchema),
    defaultValues: { quantity: CancelledQuantityValues.RETURN, reason: '' },
  });
  const cancelMutation = binding.useCancelSupplier({ onSuccess });

  return (
    <Form
      form={form}
      mutation={cancelMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: purchase.id, legId: leg.id, quantity: data.quantity, reason: data.reason })}
    >
      <RadioGroup name="quantity" label={`${leg.supplierName}'s quantity`} variant="card" options={QUANTITY_OPTIONS} />
      <TextArea
        name="reason"
        label="Reason"
        placeholder="e.g. Supplier is out of stock"
        description="Saved with the supplier; tell the supplier yourself"
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Keep Supplier
        </Button>
        <Button type="submit" variant="destructive" loadingText="Cancelling...">
          Cancel Supplier
        </Button>
      </DialogActions>
    </Form>
  );
};
