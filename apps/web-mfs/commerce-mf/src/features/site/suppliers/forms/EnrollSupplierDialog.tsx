import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useEnrollSiteSupplier } from '@/hooks/site/suppliers';
import { useSiteId } from '@/hooks/site/useSiteId';
import { type EnrollSiteSupplierFormData, enrollSiteSupplierSchema } from '@/schemas/site-suppliers';
import { PaymentTermSelector } from '@/selectors/payment-term';
import { SupplierSelector } from '@/selectors/supplier';

interface EnrollSupplierDialogProps {
  // Preselects the supplier when enrolling from its row; the supplier picker is then fixed
  supplier?: { id: string; partyId: string; defaultPaymentTermId: string | null };
  onSuccess: () => void;
  onCancel: () => void;
}

export const EnrollSupplierDialog: React.FC<EnrollSupplierDialogProps> = ({ supplier, onSuccess, onCancel }) => {
  const form = useForm<EnrollSiteSupplierFormData>({
    resolver: zodResolver(enrollSiteSupplierSchema),
    defaultValues: {
      supplierId: supplier?.id,
      paymentTermId: supplier?.defaultPaymentTermId ?? undefined,
    },
  });
  const [partyId, setPartyId] = useState<string | undefined>(supplier?.partyId);
  const siteId = useSiteId();

  const enrollMutation = useEnrollSiteSupplier({ onSuccess });

  return (
    <Form form={form} mutation={enrollMutation} resetOnSuccess onCancel={onCancel}>
      <FormSection title="Supplier" contentClassName="block">
        <div className="flex flex-col gap-4">
          <SupplierSelector
            name="supplierId"
            params={{ siteId, enrollmentStatus: 'NOT_ENROLLED' }}
            disabled={!!supplier}
            fieldKeys={{ additionalKeys: 'currencyCode,defaultPaymentTermId,partyId' }}
            onOptionSelect={(option) => {
              // A preselected supplier resolves on mount; its picks are already in place
              if (supplier) return;
              const next = option?.additionals?.partyId;
              setPartyId(typeof next === 'string' ? next : undefined);
              form.resetField('partyTaxRegistrationId');
              form.resetField('partyBankAccountId');
              form.resetField('orderRelationshipId');
              const defaultTerm = option?.additionals?.defaultPaymentTermId;
              if (typeof defaultTerm === 'string') form.setValue('paymentTermId', defaultTerm);
              else form.resetField('paymentTermId');
            }}
          />
          <PaymentTermSelector name="paymentTermId" />
          <Select
            name="partyTaxRegistrationId"
            label="Tax Registration"
            placeholder={partyId ? 'Select the registration this site is billed under' : 'Select a supplier first'}
            searchable
            disabled={!partyId}
            optionsEndpoint={partyId ? 'commerce-api/select-api/party-tax-registrations' : undefined}
            params={partyId ? { partyId } : undefined}
          />
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
