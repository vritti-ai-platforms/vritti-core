import { useCreateLocation } from '@/hooks/locations';
import {
  type LocationFormData,
  LocationRoleLabels,
  LocationRoleValues,
  locationFormResolver,
} from '@/schemas/locations';
import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { UserSelector } from '@vritti/quantum-ui/selects/user';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

interface AddLocationDialogProps {
  defaultParentId?: string | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AddLocationDialog: React.FC<AddLocationDialogProps> = ({
  defaultParentId = null,
  onSuccess,
  onCancel,
}) => {
  const isParentLocked = !!defaultParentId;
  const roleOptions = Object.values(LocationRoleValues).map((value) => ({ value, label: LocationRoleLabels[value] }));

  const form = useForm<LocationFormData>({
    resolver: locationFormResolver,
    defaultValues: {
      name: '',
      code: '',
      parentId: defaultParentId,
      sortOrder: 1,
      locationRole: 'STORAGE',
      isActive: true,
      area: '',
      managerId: undefined,
    },
  });

  // A ZONE location cannot have a parent; clear and lock the selector when the role is ZONE.
  const isZone = form.watch('locationRole') === 'ZONE';
  useEffect(() => {
    if (isZone) {
      form.setValue('parentId', null);
    }
  }, [isZone, form]);

  const createMutation = useCreateLocation({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <TextField name="name" label="Name" placeholder="e.g. Walk-in Fridge" />
      <TextField name="code" label="Code" placeholder="e.g. WIF" />
      <LocationSelector
        name="parentId"
        label="Parent Location"
        placeholder="None (root location)"
        clearable={!isParentLocked}
        disabled={isParentLocked}
      />
      <TextField name="sortOrder" label="Sort Order" type="number" placeholder="1" />
      <Select name="locationRole" label="Role" options={roleOptions} />
      <TextField name="area" label="Area" placeholder="e.g. 500 sq ft" />
      <UserSelector name="managerId" label="Manager" placeholder="Select manager" clearable />
      <Switch name="isActive" label="Active" description="Enable this storage location" />

      </div>
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Location
        </Button>
      </div>
    </Form>
  );
};
