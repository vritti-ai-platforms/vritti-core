import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { ISOCountrySelect } from '@vritti/quantum-ui/selects/iso-country';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateTaxJurisdiction } from '@/hooks/organization/tax-jurisdictions';
import {
  levelOptions,
  type TaxJurisdictionData,
  type TaxJurisdictionFormData,
  taxJurisdictionFormResolver,
} from '@/schemas/tax-jurisdictions';

interface EditJurisdictionDialogProps {
  jurisdiction: TaxJurisdictionData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditJurisdictionDialog: React.FC<EditJurisdictionDialogProps> = ({
  jurisdiction,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<TaxJurisdictionFormData>({
    resolver: taxJurisdictionFormResolver,
    defaultValues: {
      code: jurisdiction.code,
      name: jurisdiction.name,
      level: jurisdiction.level,
      parentId: jurisdiction.parentId ?? null,
      countryCode: jurisdiction.countryCode,
      regionCode: jurisdiction.regionCode ?? '',
      taxUnion: jurisdiction.taxUnion ?? '',
      isActive: jurisdiction.isActive,
    },
  });

  const updateMutation = useUpdateTaxJurisdiction({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data: TaxJurisdictionFormData) => ({
        id: jurisdiction.id,
        data: {
          ...data,
          parentId: data.parentId || null,
          regionCode: data.regionCode || undefined,
          taxUnion: data.taxUnion || undefined,
        },
      })}
    >
      <TextField name="code" label="Code" disabled />
      <TextField name="name" label="Name" placeholder="e.g. California" />
      <Select name="level" label="Level" options={levelOptions} />
      <ISOCountrySelect name="countryCode" label="Country" />
      <TextField name="regionCode" label="Region Code" placeholder="e.g. CA" />
      <TextField name="taxUnion" label="Tax Union" placeholder="e.g. EU" />
      <Switch name="isActive" label="Active" description="Inactive jurisdictions don't appear in selection dropdowns" />
      <DialogActions>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
