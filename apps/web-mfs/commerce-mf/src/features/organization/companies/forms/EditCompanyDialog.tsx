import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { PhoneField } from '@vritti/quantum-ui/PhoneField';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
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
      name: company.name,
      legalName: company.legalName ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      address: company.address ?? '',
      website: company.website ?? '',
      jurisdictionId: company.jurisdictionId ?? undefined,
      isActive: company.isActive,
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
          name: data.name,
          legalName: data.legalName || undefined,
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
          website: data.website || undefined,
          jurisdictionId: data.jurisdictionId || null,
          isActive: data.isActive,
        },
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Details">
          <TextField name="name" label="Name" placeholder="e.g. Acme Traders" />
          <TextField name="legalName" label="Legal Name" placeholder="e.g. Acme Traders Pvt Ltd" />
          <JurisdictionSelector name="jurisdictionId" clearable />
        </FormSection>
        <FormSection title="Contact">
          <TextField name="email" label="Email" type="email" placeholder="e.g. contact@acme.com" />
          <PhoneField name="phone" label="Phone" placeholder="e.g. +91 98765 43210" />
          <TextField name="website" label="Website" placeholder="e.g. https://acme.com" />
        </FormSection>
        <FormSection title="Address" contentClassName="grid grid-cols-1 gap-4">
          <TextArea name="address" label="Address" placeholder="Full postal address" />
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
