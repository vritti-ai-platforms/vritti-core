import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { useBUCurrency } from '@vritti/quantum-ui/hooks';
import { Select } from '@vritti/quantum-ui/Select';
import { TextField } from '@vritti/quantum-ui/TextField';
import { z, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { ExchangeRateTypeEnum, type PurchaseOrderDetail } from '@/schemas/purchase-orders';
import { useChangePurchaseOrderExchangeRate } from '@/site/hooks/purchase-orders';

interface ChangePurchaseOrderExchangeRateDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

const EXCHANGE_RATE_TYPE_OPTIONS = [
  { label: 'Fixed (lock rate at PO time)', value: 'FIXED' },
  { label: 'Variable (resolve at GR/invoice)', value: 'VARIABLE' },
];

const changeExchangeRateSchema = z
  .object({
    exchangeRateType: ExchangeRateTypeEnum,
    exchangeRate: zodNumericField({ positive: true, nonZero: true }).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.exchangeRateType !== 'FIXED') return;
    if (data.exchangeRate == null || Number.isNaN(data.exchangeRate)) {
      ctx.addIssue({
        code: 'custom',
        path: ['exchangeRate'],
        message: 'Exchange rate is required for FIXED policy.',
      });
    }
  });

type ChangeExchangeRateFormData = z.infer<typeof changeExchangeRateSchema>;

export const ChangePurchaseOrderExchangeRateDialog: React.FC<ChangePurchaseOrderExchangeRateDialogProps> = ({
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const buCurrencyCode = useBUCurrency();

  const form = useForm<ChangeExchangeRateFormData>({
    resolver: zodResolver(changeExchangeRateSchema),
    defaultValues: {
      exchangeRateType: purchaseOrder.exchangeRateType,
      exchangeRate: purchaseOrder.exchangeRate ?? undefined,
    },
  });

  const exchangeRateType = form.watch('exchangeRateType');
  const mutation = useChangePurchaseOrderExchangeRate({ onSuccess });

  return (
    <Form
      form={form}
      mutation={mutation}
      resetOnSuccess={false}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrder.id,
        exchangeRateType: data.exchangeRateType,
        exchangeRate: data.exchangeRateType === 'FIXED' ? (data.exchangeRate ?? undefined) : null,
      })}
    >
      <Select
        name="exchangeRateType"
        label="Exchange Rate Policy"
        description="FIXED locks the rate at PO time. VARIABLE defers to goods-receipt posting."
        options={EXCHANGE_RATE_TYPE_OPTIONS}
        clearable={false}
      />
      {exchangeRateType === 'FIXED' ? (
        <TextField
          name="exchangeRate"
          label={`Exchange Rate (${purchaseOrder.currencyCode} → ${buCurrencyCode ?? 'BU currency'})`}
          type="number"
          placeholder="e.g. 83.250000"
          positive
          nonZero
        />
      ) : null}
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save
        </Button>
      </DialogActions>
    </Form>
  );
};
