import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateSupplierSite } from '@/hooks/legal-entity/suppliers';
import { type SupplierSiteRow, type UpdateSupplierSiteFormData, updateSupplierSiteSchema } from '@/schemas/suppliers';
import { PaymentTermSelector } from '@/selectors/payment-term';

interface EditSupplierSiteDialogProps {
  supplierId: string;
  partyId: string;
  site: SupplierSiteRow;
  enrollmentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditSupplierSiteDialog: React.FC<EditSupplierSiteDialogProps> = ({
  supplierId,
  partyId,
  site,
  enrollmentId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateSupplierSiteFormData>({
    resolver: zodResolver(updateSupplierSiteSchema),
    defaultValues: {
      paymentTermId: site.paymentTermId ?? undefined,
      partyTaxRegistrationId: site.partyTaxRegistrationId ?? undefined,
      partyBankAccountId: site.partyBankAccountId ?? undefined,
      orderRelationshipId: site.orderRelationshipId ?? undefined,
    },
  });

  const updateMutation = useUpdateSupplierSite(supplierId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        siteRowId: enrollmentId,
        data: {
          paymentTermId: data.paymentTermId,
          partyTaxRegistrationId: data.partyTaxRegistrationId,
          partyBankAccountId: data.partyBankAccountId || null,
          orderRelationshipId: data.orderRelationshipId || null,
        },
      })}
    >
      <FormSection title="Enrollment" contentClassName="block">
        <div className="flex flex-col gap-4">
          <PaymentTermSelector name="paymentTermId" />
          <Select
            name="partyTaxRegistrationId"
            label="Tax Registration"
            placeholder="Select the registration this site is billed under"
            searchable
            optionsEndpoint="commerce-api/select-api/party-tax-registrations"
            params={{ partyId }}
          />
          <Select
            name="partyBankAccountId"
            label="Bank Account"
            placeholder="Select a bank account"
            searchable
            optionsEndpoint="commerce-api/select-api/party-bank-accounts"
            params={{ partyId }}
          />
          <Select
            name="orderRelationshipId"
            label="Order Contact"
            placeholder="Pick an order contact for this site"
            searchable
            optionsEndpoint="commerce-api/select-api/party-contacts"
            params={{ partyId, function: 'ORDER' }}
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
