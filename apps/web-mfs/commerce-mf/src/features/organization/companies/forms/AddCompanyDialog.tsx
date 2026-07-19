import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { PhoneField } from '@vritti/quantum-ui/PhoneField';
import { Switch } from '@vritti/quantum-ui/Switch';
import { ISOCountrySelect } from '@vritti/quantum-ui/selects/iso-country';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { JurisdictionSelector } from '@/components/JurisdictionSelector';
import { useCreateCompany } from '@/hooks/organization/companies';
import { type CreateCompanyFormData, createCompanySchema } from '@/schemas/companies';

interface AddCompanyDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddCompanyDialog: React.FC<AddCompanyDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<CreateCompanyFormData>({
    resolver: zodResolver(createCompanySchema),
    defaultValues: {
      displayName: '',
      legalName: '',
      email: '',
      phone: '',
      website: '',
      jurisdictionId: undefined,
      isActive: true,
      line1: '',
      line2: '',
      city: '',
      region: '',
      postalCode: '',
      countryCode: undefined,
    },
  });

  const createMutation = useCreateCompany({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => ({
        displayName: data.displayName,
        legalName: data.legalName || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        website: data.website || undefined,
        jurisdictionId: data.jurisdictionId || undefined,
        isActive: data.isActive,
        address:
          data.line1 && data.countryCode
            ? {
                line1: data.line1,
                line2: data.line2 || undefined,
                city: data.city || undefined,
                region: data.region || undefined,
                postalCode: data.postalCode || undefined,
                countryCode: data.countryCode,
              }
            : undefined,
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Details">
          <TextField name="displayName" label="Name" placeholder="e.g. Acme Traders" />
          <TextField name="legalName" label="Legal Name" placeholder="e.g. Acme Traders Pvt Ltd" />
          <JurisdictionSelector name="jurisdictionId" clearable />
        </FormSection>
        <FormSection title="Contact">
          <TextField name="email" label="Email" type="email" placeholder="e.g. contact@acme.com" />
          <PhoneField name="phone" label="Phone" placeholder="e.g. +91 98765 43210" />
          <TextField name="website" label="Website" placeholder="e.g. https://acme.com" />
        </FormSection>
        <FormSection title="Address">
          <TextField name="line1" label="Address Line 1" placeholder="e.g. 12 MG Road" />
          <TextField name="line2" label="Address Line 2" placeholder="Apartment, suite, etc." />
          <TextField name="city" label="City" placeholder="e.g. Bengaluru" />
          <TextField name="region" label="State / Region" placeholder="e.g. Karnataka" />
          <TextField name="postalCode" label="Postal Code" placeholder="e.g. 560001" />
          <ISOCountrySelect name="countryCode" label="Country" />
        </FormSection>
        <FormSection title="Status" contentClassName="grid grid-cols-1 gap-4">
          <Switch name="isActive" label="Active" description="Inactive companies are hidden from selection" />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Company
        </Button>
      </DialogActions>
    </Form>
  );
};
