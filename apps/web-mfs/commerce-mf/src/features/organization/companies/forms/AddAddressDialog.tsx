import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { ISOCountrySelect } from '@vritti/quantum-ui/selects/iso-country';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useAddCompanyAddress } from '@/hooks/organization/companies';
import { type AddAddressFormData, ADDRESS_TYPE_OPTIONS, addAddressSchema } from '@/schemas/party-addresses';

interface AddAddressDialogProps {
  partyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddAddressDialog: React.FC<AddAddressDialogProps> = ({ partyId, onSuccess, onCancel }) => {
  const form = useForm<AddAddressFormData>({
    resolver: zodResolver(addAddressSchema),
    defaultValues: {
      type: 'BILLING',
      line1: '',
      line2: '',
      city: '',
      region: '',
      postalCode: '',
      countryCode: '',
      isPrimary: false,
    },
  });

  const createMutation = useAddCompanyAddress(partyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data: AddAddressFormData) => ({
        ...data,
        line2: data.line2 || undefined,
        city: data.city || undefined,
        region: data.region || undefined,
        postalCode: data.postalCode || undefined,
      })}
    >
      <div className="flex flex-col gap-6">
        <FormSection title="Classification">
          <Select name="type" label="Type" placeholder="Select type" options={ADDRESS_TYPE_OPTIONS} />
          <Switch name="isPrimary" label="Primary address" description="Used as the default for this type" />
        </FormSection>
        <FormSection title="Street" contentClassName="grid grid-cols-1 gap-4">
          <TextField name="line1" label="Address line 1" placeholder="e.g. 12 MG Road" />
          <TextField name="line2" label="Address line 2" placeholder="Apartment, suite, etc." />
        </FormSection>
        <FormSection title="Location">
          <ISOCountrySelect name="countryCode" label="Country" />
          <TextField name="city" label="City" placeholder="e.g. Bengaluru" />
          <TextField name="region" label="State / Region" placeholder="e.g. Karnataka" />
          <TextField name="postalCode" label="Postal code" placeholder="e.g. 560001" />
        </FormSection>
      </div>
      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Adding...">
          Add Address
        </Button>
      </DialogActions>
    </Form>
  );
};
