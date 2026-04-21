import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { CurrencySelector } from '@vritti/quantum-ui/selects/currency';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
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
    conversionRate: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.supplierCurrencyCode || data.currencyCode === data.supplierCurrencyCode) {
      return;
    }

    if (!data.conversionRate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['conversionRate'],
        message: 'Conversion rate is required when PO currency differs from supplier currency.',
      });
      return;
    }

    const parsed = Number(data.conversionRate);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['conversionRate'],
        message: 'Conversion rate must be greater than 0.',
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
      conversionRate: String(purchaseOrder.conversionRate),
    },
  });

  const changeCurrencyMutation = useChangePurchaseOrderCurrency({ onSuccess });
  const poCurrencyCode = form.watch('currencyCode');
  const supplierCurrencyCode = form.watch('supplierCurrencyCode');
  const needsConversion = !!supplierCurrencyCode && poCurrencyCode !== supplierCurrencyCode;

  useEffect(() => {
    form.clearErrors('conversionRate');
    if (!needsConversion) {
      form.setValue('conversionRate', '1');
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
        conversionRate: data.currencyCode === data.supplierCurrencyCode ? 1 : Number(data.conversionRate),
      })}
    >
      <CurrencySelector name="currencyCode" label="PO Currency" placeholder="Select currency" />
      {needsConversion ? (
        <TextField
          name="conversionRate"
          label={`Conversion Rate (${supplierCurrencyCode} -> ${poCurrencyCode})`}
          type="number"
          placeholder="e.g. 83.250000"
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
