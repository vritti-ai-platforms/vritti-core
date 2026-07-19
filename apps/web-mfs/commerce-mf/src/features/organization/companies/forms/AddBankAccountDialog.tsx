import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateCompanyBankAccount } from '@/hooks/organization/companies';
import { type PartyBankAccountFormData, partyBankAccountSchema } from '@/schemas/party-bank-accounts';

interface AddBankAccountDialogProps {
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddBankAccountDialog: React.FC<AddBankAccountDialogProps> = ({ companyId, onSuccess, onCancel }) => {
  const form = useForm<PartyBankAccountFormData>({
    resolver: zodResolver(partyBankAccountSchema),
    defaultValues: {
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      upiId: '',
      bankName: '',
      isPrimary: false,
      isActive: true,
    },
  });

  const createMutation = useCreateCompanyBankAccount(companyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        accountName: data.accountName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode || undefined,
        upiId: data.upiId || undefined,
        bankName: data.bankName || undefined,
        isPrimary: data.isPrimary,
        isActive: data.isActive,
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Bank Account">
          <TextField name="accountName" label="Account Name" placeholder="e.g. Acme Foods Pvt Ltd" />
          <TextField name="accountNumber" label="Account Number" placeholder="e.g. 50100123456789" />
          <TextField name="ifscCode" label="IFSC Code" placeholder="e.g. HDFC0001234" />
          <TextField name="bankName" label="Bank Name" placeholder="e.g. HDFC Bank" />
          <TextField name="upiId" label="UPI ID" placeholder="e.g. acme@hdfcbank" className="col-span-2" />
        </FormSection>
        <FormSection title="Status" contentClassName="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Switch name="isPrimary" label="Primary account" description="Default payee for this company" />
          <Switch name="isActive" label="Active" description="Inactive accounts are hidden from payment picks" />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Account
        </Button>
      </DialogActions>
    </Form>
  );
};
