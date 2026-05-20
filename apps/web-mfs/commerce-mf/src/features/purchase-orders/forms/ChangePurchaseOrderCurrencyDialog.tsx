import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { CurrencySelector } from '@vritti/quantum-ui/selects/currency';
import { TextField } from '@vritti/quantum-ui/TextField';
import { z, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useChangePurchaseOrderCurrency } from '@/hooks/purchase-orders';
import type { PurchaseOrderDetail } from '@/schemas/purchase-orders';

interface ChangePurchaseOrderCurrencyDialogProps {
  purchaseOrder: PurchaseOrderDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

const changeCurrencySchema = z
  .object({
    currencyCode: z.string().regex(/^[A-Z]{3}$/, 'Currency is required'),
    supplierCurrencyCode: z.string().optional(),
    conversionRate: zodNumericField({ positive: true, nonZero: true }).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.supplierCurrencyCode || data.currencyCode === data.supplierCurrencyCode) return;

    if (data.conversionRate == null || Number.isNaN(data.conversionRate)) {
      ctx.addIssue({
        code: 'custom',
        path: ['conversionRate'],
        message: 'Conversion rate is required when PO currency differs from supplier currency.',
      });
    }
  });

type ChangeCurrencyFormData = z.infer<typeof changeCurrencySchema>;

export const ChangePurchaseOrderCurrencyDialog: React.FC<ChangePurchaseOrderCurrencyDialogProps> = ({
  purchaseOrder,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<ChangeCurrencyFormData>({
    resolver: zodResolver(changeCurrencySchema),
    defaultValues: {
      currencyCode: purchaseOrder.currencyCode,
      supplierCurrencyCode: purchaseOrder.supplierCurrencyCode ?? undefined,
      conversionRate: purchaseOrder.conversionRate,
    },
  });

  const changeCurrencyMutation = useChangePurchaseOrderCurrency({ onSuccess });
  const poCurrencyCode = form.watch('currencyCode');
  const supplierCurrencyCode = form.watch('supplierCurrencyCode');
  const needsConversion = !!supplierCurrencyCode && poCurrencyCode !== supplierCurrencyCode;

  useEffect(() => {
    form.clearErrors('conversionRate');
    if (!needsConversion) {
      form.setValue('conversionRate', 1);
    }
  }, [needsConversion, form]);

  return (
    <Form
      form={form}
      mutation={changeCurrencyMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: purchaseOrder.id,
        currencyCode: data.currencyCode,
        conversionRate: data.currencyCode === data.supplierCurrencyCode ? 1 : (data.conversionRate ?? 1),
      })}
    >
      <CurrencySelector name="currencyCode" label="PO Currency" placeholder="Select currency" />
      {needsConversion ? (
        <TextField
          name="conversionRate"
          label={`Conversion Rate (${supplierCurrencyCode} -> ${poCurrencyCode})`}
          type="number"
          placeholder="e.g. 83.250000"
          positive
          nonZero
        />
      ) : null}
      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Updating...">
          Change Currency
        </Button>
      </div>
    </Form>
  );
};
