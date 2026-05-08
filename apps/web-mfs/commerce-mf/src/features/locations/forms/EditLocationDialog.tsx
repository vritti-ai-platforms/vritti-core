import { Button } from '@vritti/quantum-ui/Button';
import { Form } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { UserSelector } from '@vritti/quantum-ui/selects/user';
import { TextArea } from '@vritti/quantum-ui/TextArea';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateLocation } from '@/hooks/locations';
import type { LocationData } from '@/schemas/locations';
import { LocationRoleLabels, LocationRoleValues, type LocationFormData, locationFormResolver } from '@/schemas/locations';

interface EditLocationDialogProps {
  location: LocationData;
  onSuccess: () => void;
  onCancel: () => void;
}

export const EditLocationDialog: React.FC<EditLocationDialogProps> = ({ location, onSuccess, onCancel }) => {
  const roleOptions = Object.values(LocationRoleValues).map((value) => ({ value, label: LocationRoleLabels[value] }));
  const form = useForm<LocationFormData>({
    resolver: locationFormResolver,
    defaultValues: {
      name: location.name,
      code: location.code,
      parentId: location.parentId ?? null,
      sortOrder: location.sortOrder,
      locationRole: location.locationRole,
      isActive: location.isActive,
      area: location.area ?? '',
      managerId: location.managerId ?? undefined,
      address: location.address ?? '',
    },
  });

  const updateMutation = useUpdateLocation({ onSuccess });

  return (
    <Form
      form={form}
      mutation={updateMutation}
     
      onCancel={onCancel}
      transformSubmit={(data) => ({
        id: location.id,
        data: {
          name: data.name,
          code: data.code,
          parentId: data.parentId || null,
          sortOrder: Number(data.sortOrder),
          locationRole: data.locationRole,
          isActive: data.isActive,
          area: data.area,
          managerId: data.managerId,
          address: data.address,
        },
      })}
    >
      <TextField name="name" label="Name" placeholder="e.g. Walk-in Fridge" />
      <TextField name="code" label="Code" placeholder="e.g. WIF" />
      <LocationSelector name="parentId" label="Parent Location" placeholder="None (root location)" clearable />
      <TextField name="sortOrder" label="Sort Order" type="number" placeholder="1" />
      <Select name="locationRole" label="Role" options={roleOptions} />
      <TextField name="area" label="Area" placeholder="e.g. 500 sq ft" />
      <UserSelector name="managerId" label="Manager" placeholder="Select manager" clearable />
      <TextArea name="address" label="Address" placeholder="Location address" />
      <Switch name="isActive" label="Active" description="Enable this storage location" />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </div>
    </Form>
  );
};
