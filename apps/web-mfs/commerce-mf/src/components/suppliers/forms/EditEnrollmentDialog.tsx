import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { usePartyHasSalesTaxRegistration } from '@/hooks/organization/party-tax-registrations';
import {
  type EnrolledSupplierEnrollmentRow,
  type SupplierEnrollmentKey,
  type UpdateSupplierEnrollmentFormData,
  updateSupplierEnrollmentSchema,
} from '@/schemas/supplier-enrollments';
import { PartyCommunicationSelector } from '@/selectors/party-communication';
import { PaymentTermSelector } from '@/selectors/payment-term';
import type { SupplierEnrollmentBinding } from '../bindings';
import { NoTaxIdentityAlert } from '../NoTaxIdentityAlert';
import { TaxIdField } from '../TaxIdField';

interface EditEnrollmentDialogProps {
  binding: SupplierEnrollmentBinding;
  pair: SupplierEnrollmentKey;
  enrollment: EnrolledSupplierEnrollmentRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditEnrollmentDialog: React.FC<EditEnrollmentDialogProps> = ({
  binding,
  pair,
  enrollment,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<UpdateSupplierEnrollmentFormData>({
    resolver: zodResolver(updateSupplierEnrollmentSchema),
    defaultValues: {
      paymentTermId: enrollment.paymentTermId,
      partyTaxRegistrationId: enrollment.partyTaxRegistrationId ?? undefined,
      partyBankAccountId: enrollment.partyBankAccountId ?? undefined,
      orderRelationshipId: enrollment.orderRelationshipId ?? undefined,
      orderEmailCommunicationId: enrollment.orderEmailCommunicationId,
      orderPhoneCommunicationId: enrollment.orderPhoneCommunicationId,
    },
  });

  const party = binding.useSupplierParty(pair.supplierId);
  const partyId = party?.partyId;
  const { data: hasSalesTaxRegistration } = usePartyHasSalesTaxRegistration(partyId);
  const updateMutation = binding.useUpdateEnrollment({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        ...pair,
        data: {
          paymentTermId: data.paymentTermId,
          partyTaxRegistrationId: data.partyTaxRegistrationId ?? null,
          partyBankAccountId: data.partyBankAccountId || null,
          orderRelationshipId: data.orderRelationshipId || null,
          orderEmailCommunicationId: data.orderEmailCommunicationId,
          orderPhoneCommunicationId: data.orderPhoneCommunicationId,
        },
      })}
    >
      <FormSection title="Enrollment" contentClassName="block">
        <div className="flex flex-col gap-4">
          <NoTaxIdentityAlert partyTaxId={party?.partyTaxId} hasSalesTaxRegistration={hasSalesTaxRegistration} />
          <PaymentTermSelector name="paymentTermId" />
          <Select
            name="partyTaxRegistrationId"
            label="Tax Registration"
            placeholder="Select the registration the site is invoiced under"
            description="Leave empty if the supplier is unregistered"
            searchable
            clearable
            disabled={!partyId}
            optionsEndpoint={partyId ? 'commerce-api/select-api/party-tax-registrations' : undefined}
            params={partyId ? { partyId, salesTaxOnly: true } : undefined}
          />
          <TaxIdField taxId={party?.partyTaxId} taxIdType={party?.partyTaxIdType} />
          <Select
            name="partyBankAccountId"
            label="Bank Account"
            placeholder="Select a bank account"
            searchable
            disabled={!partyId}
            optionsEndpoint={partyId ? 'commerce-api/select-api/party-bank-accounts' : undefined}
            params={partyId ? { partyId } : undefined}
          />
          <Select
            name="orderRelationshipId"
            label="Order Contact"
            placeholder="Select an order contact"
            searchable
            disabled={!partyId}
            optionsEndpoint={partyId ? 'commerce-api/select-api/party-contacts' : undefined}
            params={partyId ? { partyId, function: 'ORDER' } : undefined}
          />
          <PartyCommunicationSelector name="orderEmailCommunicationId" partyId={partyId} channel="EMAIL" />
          <PartyCommunicationSelector name="orderPhoneCommunicationId" partyId={partyId} channel="PHONE" />
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
