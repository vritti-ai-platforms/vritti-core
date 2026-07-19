import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateSupplierSite } from '@/hooks/legal-entity/suppliers';
import { type SupplierSiteRow, type UpdateSupplierSiteFormData, updateSupplierSiteSchema } from '@/schemas/suppliers';

interface EditSupplierSiteDialogProps {
  supplierId: string;
  partyId: string;
  site: SupplierSiteRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditSupplierSiteDialog: React.FC<EditSupplierSiteDialogProps> = ({
  supplierId,
  partyId,
  site,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateSupplierSiteFormData>({
    resolver: zodResolver(updateSupplierSiteSchema),
    defaultValues: {
      partyTaxRegistrationId: site.partyTaxRegistrationId ?? '',
      partyBankAccountId: site.partyBankAccountId ?? '',
      isActive: site.isActive,
    },
  });

  const updateMutation = useUpdateSupplierSite(supplierId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        siteRowId: site.id,
        data: {
          partyTaxRegistrationId: data.partyTaxRegistrationId || null,
          partyBankAccountId: data.partyBankAccountId || null,
          isActive: data.isActive,
        },
      })}
    >
      <FormSection title="Enrollment" contentClassName="block">
        <div className="flex flex-col gap-4">
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
          <Switch name="isActive" label="Active" description="Inactive enrollments block purchasing at this site" />
        </div>
      </FormSection>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
