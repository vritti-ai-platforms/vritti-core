import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { ISOCountrySelect } from '@vritti/quantum-ui/selects/iso-country';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateTaxGroup } from '@/hooks/organization/tax-groups';
import {
  type EditTaxGroupFormData,
  editTaxGroupFormSchema,
  TAX_TREATMENT_OPTIONS,
  type TaxGroupData,
} from '@/schemas/tax-groups';

interface EditTaxGroupDialogProps {
  taxGroup: TaxGroupData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditTaxGroupDialog: React.FC<EditTaxGroupDialogProps> = ({ taxGroup, onSuccess, onCancel }) => {
  const form = useForm<EditTaxGroupFormData>({
    resolver: zodResolver(editTaxGroupFormSchema),
    defaultValues: {
      countryCode: taxGroup.countryCode,
      code: taxGroup.code,
      name: taxGroup.name,
      treatment: taxGroup.treatment,
      legalText: taxGroup.legalText ?? '',
    },
  });

  const updateMutation = useUpdateTaxGroup({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={({ countryCode: _countryCode, ...data }: EditTaxGroupFormData) => ({
        id: taxGroup.id,
        data: { ...data, legalText: data.legalText || null },
      })}
    >
      <ISOCountrySelect name="countryCode" disabled description="Country cannot be changed" />
      <TextField name="code" label="Code" placeholder="e.g. gst-5" />
      <TextField name="name" label="Name" placeholder="e.g. GST 5%" />
      <Select name="treatment" label="Treatment" options={TAX_TREATMENT_OPTIONS} />
      <TextArea
        name="legalText"
        label="Legal Text (optional)"
        placeholder="e.g. Exempt under Article 47"
        description="Printed on documents taxed by this group"
      />
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
