import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateSiteEnrollment } from '@/hooks/site/suppliers';
import {
  type SiteSupplierRow,
  type UpdateSiteEnrollmentFormData,
  updateSiteEnrollmentSchema,
} from '@/schemas/site-suppliers';

interface EditEnrollmentDialogProps {
  supplier: SiteSupplierRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditEnrollmentDialog: React.FC<EditEnrollmentDialogProps> = ({ supplier, onSuccess, onCancel }) => {
  const form = useForm<UpdateSiteEnrollmentFormData>({
    resolver: zodResolver(updateSiteEnrollmentSchema),
    defaultValues: {
      partyTaxRegistrationId: supplier.partyTaxRegistrationId ?? '',
      partyBankAccountId: supplier.partyBankAccountId ?? '',
      isActive: supplier.enrollmentActive,
    },
  });

  const updateMutation = useUpdateSiteEnrollment({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierId: supplier.id,
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
            params={{ partyId: supplier.partyId }}
          />
          <Select
            name="partyBankAccountId"
            label="Branch Bank Account"
            placeholder="Company primary account when left empty"
            searchable
            optionsEndpoint="commerce-api/select-api/party-bank-accounts"
            params={{ partyId: supplier.partyId }}
          />
          <Switch
            name="isActive"
            label="Active"
            description="Inactive enrollments block purchasing from this supplier"
          />
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
