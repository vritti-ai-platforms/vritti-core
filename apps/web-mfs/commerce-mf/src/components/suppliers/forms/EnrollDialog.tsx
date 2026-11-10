import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { usePartyHasSalesTaxRegistration } from '@/hooks/organization/party-tax-registrations';
import {
  type CreateSupplierEnrollmentFormData,
  createSupplierEnrollmentSchema,
  type SupplierEnrollmentKey,
} from '@/schemas/supplier-enrollments';
import { EnrolledSiteSelector } from '@/selectors/enrolled-site';
import { PartyCommunicationSelector } from '@/selectors/party-communication';
import { PaymentTermSelector } from '@/selectors/payment-term';
import { SiteSupplierSelector } from '@/selectors/site-supplier';
import type { SupplierEnrollmentBinding } from '../bindings';
import { NoTaxIdentityAlert } from '../NoTaxIdentityAlert';
import { TaxIdField } from '../TaxIdField';

interface EnrollDialogProps {
  binding: SupplierEnrollmentBinding;
  // The fixed side(s) of the pair; the side left out is picked in the dialog from the not-enrolled ones
  pair: Partial<SupplierEnrollmentKey>;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EnrollDialog: React.FC<EnrollDialogProps> = ({ binding, pair, onSuccess, onCancel }) => {
  const form = useForm<CreateSupplierEnrollmentFormData>({
    resolver: zodResolver(createSupplierEnrollmentSchema),
    defaultValues: {
      supplierId: pair.supplierId,
      siteId: pair.siteId,
      isActive: true,
    },
  });
  const supplierId = useWatch({ control: form.control, name: 'supplierId' });
  const party = binding.useSupplierParty(supplierId);
  const partyId = party?.partyId;
  const { data: hasSalesTaxRegistration } = usePartyHasSalesTaxRegistration(partyId);

  // Starts the payment term from the supplier's default once the supplier is known
  useEffect(() => {
    if (party && !form.getValues('paymentTermId')) form.setValue('paymentTermId', party.defaultPaymentTermId);
  }, [party, form]);

  const createMutation = binding.useCreateEnrollment({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        supplierId: data.supplierId,
        siteId: data.siteId,
        paymentTermId: data.paymentTermId,
        partyTaxRegistrationId: data.partyTaxRegistrationId ?? undefined,
        partyBankAccountId: data.partyBankAccountId ?? undefined,
        orderRelationshipId: data.orderRelationshipId ?? undefined,
        orderEmailCommunicationId: data.orderEmailCommunicationId,
        orderPhoneCommunicationId: data.orderPhoneCommunicationId,
        isActive: data.isActive,
      })}
    >
      <FormSection title="Enrollment" contentClassName="block">
        <div className="flex flex-col gap-4">
          <NoTaxIdentityAlert partyTaxId={party?.partyTaxId} hasSalesTaxRegistration={hasSalesTaxRegistration} />
          {!pair.supplierId && (
            <SiteSupplierSelector
              name="supplierId"
              enrollmentStatus="NOT_ENROLLED"
              onOptionSelect={(option) => {
                if (option?.value === supplierId) return;
                form.resetField('paymentTermId');
                form.resetField('partyTaxRegistrationId');
                form.resetField('partyBankAccountId');
                form.resetField('orderRelationshipId');
                form.resetField('orderEmailCommunicationId');
                form.resetField('orderPhoneCommunicationId');
              }}
            />
          )}
          {!pair.siteId && <EnrolledSiteSelector name="siteId" supplierId={supplierId} isEnrolled={false} />}
          <PaymentTermSelector name="paymentTermId" />
          <Select
            name="partyTaxRegistrationId"
            label="Tax Registration"
            placeholder={partyId ? 'Select the registration the site is billed under' : 'Select a supplier first'}
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
      <FormSection title="Status" contentClassName="block">
        <div className="flex flex-col gap-4">
          <Switch
            name="isActive"
            label="Active"
            description="An inactive enrollment stops the site buying from the supplier"
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
