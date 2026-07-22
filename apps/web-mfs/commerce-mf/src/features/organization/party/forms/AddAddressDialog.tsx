import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { ISOCountrySelect } from '@vritti/quantum-ui/selects/iso-country';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { ADDRESS_FUNCTION_OPTIONS, type AddAddressFormData, addAddressSchema } from '@/schemas/party-addresses';
import type { AddressesBinding } from '../bindings';
import { FunctionsEditor } from './FunctionsEditor';

interface AddAddressDialogProps {
  partyId: string;
  binding: AddressesBinding;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddAddressDialog: React.FC<AddAddressDialogProps> = ({ partyId, binding, onSuccess, onCancel }) => {
  const form = useForm<AddAddressFormData>({
    resolver: zodResolver(addAddressSchema),
    defaultValues: {
      line1: '',
      line2: '',
      city: '',
      region: '',
      postalCode: '',
      countryCode: '',
      functions: [],
    },
  });

  const createMutation = binding.useCreate(partyId, { onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data: AddAddressFormData) => ({
        ...data,
        line2: data.line2,
        city: data.city,
        region: data.region,
        postalCode: data.postalCode,
      })}
    >
      <div className="flex flex-col gap-6">
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
        <FormSection title="Handles" contentClassName="block">
          <FunctionsEditor name="functions" label="Address Functions" options={ADDRESS_FUNCTION_OPTIONS} />
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
