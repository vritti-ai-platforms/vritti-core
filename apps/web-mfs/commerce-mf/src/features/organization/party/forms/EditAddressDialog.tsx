import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { ISOCountrySelect } from '@vritti/quantum-ui/selects/iso-country';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import {
  ADDRESS_TYPE_OPTIONS,
  type AddAddressFormData,
  addAddressSchema,
  type PartyAddressRow,
} from '@/schemas/party-addresses';
import type { AddressesBinding } from '../bindings';

interface EditAddressDialogProps {
  partyId: string;
  binding: AddressesBinding;
  address: PartyAddressRow;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditAddressDialog: React.FC<EditAddressDialogProps> = ({
  partyId,
  binding,
  address,
  onSuccess,
  onCancel,
}) => {
  const form = useForm<AddAddressFormData>({
    resolver: zodResolver(addAddressSchema),
    defaultValues: {
      type: address.type,
      line1: address.line1,
      line2: address.line2 ?? '',
      city: address.city ?? '',
      region: address.region ?? '',
      postalCode: address.postalCode ?? '',
      countryCode: address.countryCode,
      isPrimary: address.isPrimary,
    },
  });

  const updateMutation = binding.useUpdate(partyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
      onCancel={onCancel}
      transformSubmit={(data: AddAddressFormData) => ({
        partyId,
        addressId: address.id,
        data: {
          ...data,
          line2: data.line2,
          city: data.city,
          region: data.region,
          postalCode: data.postalCode,
        },
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
