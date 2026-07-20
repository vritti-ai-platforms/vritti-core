import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { ISOCountrySelect } from '@vritti/quantum-ui/selects/iso-country';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateTaxJurisdiction } from '@/hooks/organization/tax-jurisdictions';
import {
  levelOptions,
  type TaxJurisdictionFormData,
  TaxJurisdictionLevelValues,
  taxJurisdictionFormResolver,
} from '@/schemas/tax-jurisdictions';

interface AddJurisdictionDialogProps {
  defaultParentId?: string | null;
  defaultCountryCode?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddJurisdictionDialog: React.FC<AddJurisdictionDialogProps> = ({
  defaultParentId = null,
  defaultCountryCode = '',
  onSuccess,
  onCancel,
}) => {
  const form = useForm<TaxJurisdictionFormData>({
    resolver: taxJurisdictionFormResolver,
    defaultValues: {
      code: '',
      name: '',
      level: defaultParentId ? TaxJurisdictionLevelValues.STATE : TaxJurisdictionLevelValues.COUNTRY,
      parentId: defaultParentId,
      countryCode: defaultCountryCode,
      regionCode: '',
      taxUnion: '',
      isActive: true,
    },
  });

  const createMutation = useCreateTaxJurisdiction({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data: TaxJurisdictionFormData) => ({
        ...data,
        parentId: data.parentId || null,
        regionCode: data.regionCode,
        taxUnion: data.taxUnion,
      })}
    >
      <TextField name="code" label="Code" placeholder="e.g. us-ca" />
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
        <Button type="submit" loadingText="Creating...">
          Add Jurisdiction
        </Button>
      </DialogActions>
    </Form>
  );
};
