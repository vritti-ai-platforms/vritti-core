import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddSupplierSite } from '@/hooks/legal-entity/suppliers';
import { type AddSupplierSiteFormData, addSupplierSiteSchema } from '@/schemas/suppliers';
import { PaymentTermSelector } from '@/selectors/payment-term';
import { SiteSelector } from '@/selectors/site';

interface AddSupplierSiteDialogProps {
  supplierId: string;
  partyId: string;
  defaultPaymentTermId: string | null;
  // Preselects the site when enrolling from its row; the site picker is then fixed
  siteId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddSupplierSiteDialog: React.FC<AddSupplierSiteDialogProps> = ({
  supplierId,
  partyId,
  defaultPaymentTermId,
  siteId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddSupplierSiteFormData>({
    resolver: zodResolver(addSupplierSiteSchema),
    defaultValues: { siteId, paymentTermId: defaultPaymentTermId ?? undefined },
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
        paymentTermId: data.paymentTermId,
        partyTaxRegistrationId: data.partyTaxRegistrationId,
        partyBankAccountId: data.partyBankAccountId,
        orderRelationshipId: data.orderRelationshipId,
      })}
    >
      <FormSection title="Enrollment" contentClassName="block">
        <div className="flex flex-col gap-4">
          <SiteSelector name="siteId" disabled={!!siteId} />
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
        <Button type="submit" loadingText="Enrolling...">
          Enroll Supplier
        </Button>
      </DialogActions>
    </Form>
  );
};
