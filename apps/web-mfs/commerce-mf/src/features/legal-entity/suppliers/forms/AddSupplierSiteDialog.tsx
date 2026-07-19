import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { SiteSelector } from '@vritti/quantum-ui/selects/site';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddSupplierSite } from '@/hooks/legal-entity/suppliers';
import { type AddSupplierSiteFormData, addSupplierSiteSchema } from '@/schemas/suppliers';

interface AddSupplierSiteDialogProps {
  supplierId: string;
  partyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierSiteDialog: React.FC<AddSupplierSiteDialogProps> = ({
  supplierId,
  partyId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddSupplierSiteFormData>({
    resolver: zodResolver(addSupplierSiteSchema),
    defaultValues: {
      siteId: '',
      partyTaxRegistrationId: '',
      partyBankAccountId: '',
    },
  });

  const addMutation = useAddSupplierSite(supplierId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={addMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        siteId: data.siteId,
        partyTaxRegistrationId: data.partyTaxRegistrationId || undefined,
        partyBankAccountId: data.partyBankAccountId || undefined,
      })}
    >
      <FormSection title="Enrollment" contentClassName="block">
        <div className="flex flex-col gap-4">
          <SiteSelector name="siteId" />
          <Select
            name="partyTaxRegistrationId"
            label="Origin Tax Registration"
            placeholder="Auto-pick when the company has one"
            searchable
            optionsEndpoint="commerce-api/select-api/party-tax-registrations"
            params={{ partyId }}
          />
          <Select
            name="partyBankAccountId"
            label="Branch Bank Account"
            placeholder="Company primary account when left empty"
            searchable
            optionsEndpoint="commerce-api/select-api/party-bank-accounts"
            params={{ partyId }}
          />
        </div>
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Enrolling...">
          Enroll Site
        </Button>
      </DialogActions>
    </Form>
  );
};
