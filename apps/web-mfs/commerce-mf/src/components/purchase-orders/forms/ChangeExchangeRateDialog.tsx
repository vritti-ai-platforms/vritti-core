import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useWorkspaceCurrency } from '@vritti/quantum-ui/hooks';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type ChangePurchaseOrderExchangeRateFormData,
  changePurchaseOrderExchangeRateSchema,
  type PurchaseOrderDetail,
} from '@/schemas/purchase-orders';
import type { PurchaseOrdersBinding } from '../bindings';

interface ChangeExchangeRateDialogProps {
  binding: PurchaseOrdersBinding;
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

// Changes how much 1 unit of the order's currency is in the legal entity's, until a receipt of the order is posted
export const ChangeExchangeRateDialog: React.FC<ChangeExchangeRateDialogProps> = ({
  binding,
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const leCurrencyCode = useWorkspaceCurrency();
  const form = useForm<ChangePurchaseOrderExchangeRateFormData>({
    resolver: zodResolver(changePurchaseOrderExchangeRateSchema),
    defaultValues: { exchangeRate: purchaseOrder.exchangeRate },
  });
  const mutation = binding.useChangeExchangeRate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({ id: purchaseOrder.id, exchangeRate: data.exchangeRate })}
    >
      <TextField
        name="exchangeRate"
        label={`1 ${purchaseOrder.currencyCode} in ${leCurrencyCode}`}
        type="number"
        placeholder="e.g. 83.25"
        positive
        nonZero
      />
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Rate
        </Button>
      </DialogActions>
    </Form>
  );
};
