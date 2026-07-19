import { Button } from '@vritti/quantum-ui/Button';
import { DatePicker } from '@vritti/quantum-ui/DatePicker';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateCompanyLicense } from '@/hooks/organization/companies';
import {
  LICENSE_TYPE_OPTIONS,
  type PartyLicenseFormData,
  type PartyLicenseRow,
  partyLicenseSchema,
} from '@/schemas/party-licenses';

interface EditLicenseDialogProps {
  companyId: string;
  license: PartyLicenseRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditLicenseDialog: React.FC<EditLicenseDialogProps> = ({ companyId, license, onSuccess, onCancel }) => {
  const form = useForm<PartyLicenseFormData>({
    resolver: zodResolver(partyLicenseSchema),
    defaultValues: {
      licenseType: license.licenseType,
      licenseNumber: license.licenseNumber,
      region: license.region ?? '',
      validTo: license.validTo ?? '',
      notes: license.notes ?? '',
      isActive: license.isActive,
    },
  });

  const updateMutation = useUpdateCompanyLicense(companyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data) => ({
        licenseId: license.id,
        data: {
          licenseType: data.licenseType,
          licenseNumber: data.licenseNumber,
          region: data.region || null,
          validTo: data.validTo || null,
          notes: data.notes || null,
          isActive: data.isActive,
        },
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="License">
          <Select name="licenseType" label="Type" placeholder="Select type" options={LICENSE_TYPE_OPTIONS} />
          <TextField name="licenseNumber" label="License Number" placeholder="e.g. DL-20B-123456" />
          <TextField name="region" label="Region" placeholder="e.g. Karnataka" />
          <DatePicker name="validTo" label="Valid To (optional)" />
          <TextArea name="notes" label="Notes" placeholder="Optional notes" className="col-span-2" />
        </FormSection>
        <FormSection title="Status" contentClassName="grid grid-cols-1 gap-4">
          <Switch name="isActive" label="Active" description="Inactive licenses are ignored during compliance checks" />
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
