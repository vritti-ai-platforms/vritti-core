import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  type SupplierAtSiteData,
  type UpdateSiteEnrollmentFormData,
  updateSiteEnrollmentSchema,
} from '@/schemas/site-suppliers';
import { PaymentTermSelector } from '@/selectors/payment-term';
import type { SupplierSiteBinding } from '../bindings';
import type { SupplierSiteRef } from '../types';

interface EditEnrollmentDialogProps {
  binding: SupplierSiteBinding;
  supplierRef: SupplierSiteRef;
  supplier: SupplierAtSiteData;
  enrollmentId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditEnrollmentDialog: React.FC<EditEnrollmentDialogProps> = ({
  binding,
  supplierRef,
  supplier,
  enrollmentId,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateSiteEnrollmentFormData>({
    resolver: zodResolver(updateSiteEnrollmentSchema),
    defaultValues: {
      paymentTermId: supplier.paymentTermId ?? undefined,
      partyTaxRegistrationId: supplier.partyTaxRegistrationId ?? undefined,
      partyBankAccountId: supplier.partyBankAccountId ?? undefined,
      orderRelationshipId: supplier.orderRelationshipId ?? undefined,
    },
  });

  const updateMutation = binding.useUpdateEnrollment(supplierRef, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        enrollmentId,
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
            params={{ partyId: supplier.partyId }}
          />
          <Select
            name="partyBankAccountId"
            label="Bank Account"
            placeholder="Select a bank account"
            searchable
            optionsEndpoint="commerce-api/select-api/party-bank-accounts"
            params={{ partyId: supplier.partyId }}
          />
          <Select
            name="orderRelationshipId"
            label="Order Contact"
            placeholder="Select an order contact"
            searchable
            optionsEndpoint="commerce-api/select-api/party-contacts"
            params={{ partyId: supplier.partyId, function: 'ORDER' }}
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
