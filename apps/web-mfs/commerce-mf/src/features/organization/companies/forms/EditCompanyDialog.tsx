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
import { useUpdateCompany } from '@/hooks/organization/companies';
import { type CompanyData, type UpdateCompanyFormData, updateCompanySchema } from '@/schemas/companies';

interface EditCompanyDialogProps {
  company: CompanyData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditCompanyDialog: React.FC<EditCompanyDialogProps> = ({ company, onSuccess, onCancel }) => {
  const form = useForm<UpdateCompanyFormData>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      displayName: company.displayName,
      legalName: company.legalName ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      website: company.website ?? '',
      jurisdictionId: company.jurisdictionId ?? undefined,
      isActive: company.isActive,
      line1: company.primaryAddress?.line1 ?? '',
      line2: company.primaryAddress?.line2 ?? '',
      city: company.primaryAddress?.city ?? '',
      region: company.primaryAddress?.region ?? '',
      postalCode: company.primaryAddress?.postalCode ?? '',
      countryCode: company.primaryAddress?.countryCode ?? undefined,
    },
  });

  const updateMutation = useUpdateCompany({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: company.id,
        data: {
          displayName: data.displayName,
          legalName: data.legalName,
          email: data.email,
          phone: data.phone,
          website: data.website,
          jurisdictionId: data.jurisdictionId || null,
          isActive: data.isActive,
          address:
            data.line1 && data.countryCode
              ? {
                  line1: data.line1,
                  line2: data.line2,
                  city: data.city,
                  region: data.region,
                  postalCode: data.postalCode,
                  countryCode: data.countryCode,
                }
              : undefined,
        },
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
