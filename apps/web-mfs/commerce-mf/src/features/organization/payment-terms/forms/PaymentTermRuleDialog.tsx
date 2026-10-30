import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddPaymentTermRule, useUpdatePaymentTermRule } from '@/hooks/organization/payment-terms';
import {
  type PaymentTermRuleData,
  type PaymentTermRuleFormData,
  paymentTermRuleResolver,
} from '@/schemas/payment-terms';

interface PaymentTermRuleDialogProps {
  paymentTermId: string;
  rule?: PaymentTermRuleData;
  remainingPercent: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PaymentTermRuleDialog: React.FC<PaymentTermRuleDialogProps> = ({
  paymentTermId,
  rule,
  remainingPercent,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<PaymentTermRuleFormData>({
    resolver: paymentTermRuleResolver,
    defaultValues: rule
      ? {
          percent: rule.percent,
          dueDays: rule.dueDays,
          discountPercent: rule.discountPercent,
          discountDays: rule.discountDays,
        }
      : { percent: remainingPercent, dueDays: 30, discountPercent: null, discountDays: null },
  });

  const addMutation = useAddPaymentTermRule({ onSuccess });
  const updateMutation = useUpdatePaymentTermRule({ onSuccess });

  const body = (
    <>
      <div className="space-y-6">
        <FormSection title="Due" contentClassName="block">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              name="percent"
              label="Share of invoice (%)"
              type="number"
              placeholder="100"
              positive
              description="How much of the invoice this rule makes due"
            />
            <TextField
              name="dueDays"
              label="Due after (days)"
              type="number"
              placeholder="30"
              integer
              description="Counted from the term's baseline date"
            />
          </div>
        </FormSection>
        <FormSection title="Early-payment discount" contentClassName="block">
          <div className="grid grid-cols-2 gap-4">
            <TextField name="discountPercent" label="Discount (%)" type="number" placeholder="None" positive />
            <TextField name="discountDays" label="If paid within (days)" type="number" placeholder="None" integer />
          </div>
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          {rule ? 'Save Rule' : 'Add Rule'}
        </Button>
      </DialogActions>
    </>
  );

  return rule ? (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({ paymentTermId, ruleId: rule.id, data })}
    >
      {body}
    </Form>
  ) : (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({ paymentTermId, data })}
    >
      {body}
    </Form>
  );
};
