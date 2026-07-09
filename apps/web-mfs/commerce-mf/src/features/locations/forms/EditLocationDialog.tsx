import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { LocationSelector } from '@vritti/quantum-ui/selects/location';
import { UserSelector } from '@vritti/quantum-ui/selects/user';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useUpdateLocation } from '@/hooks/locations';
import type { LocationData } from '@/schemas/locations';
import {
  type LocationFormData,
  LocationRoleLabels,
  LocationRoleValues,
  locationFormResolver,
} from '@/schemas/locations';

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
          sortOrder: data.sortOrder,
          locationRole: data.locationRole,
          isActive: data.isActive,
          area: data.area,
          managerId: data.managerId,
        },
      })}
    >
      <FormSection title="Details" description="What the location is and where it sits in the hierarchy.">
        <div className="grid grid-cols-2 gap-4">
          <TextField name="name" label="Name" placeholder="e.g. Walk-in Fridge" />
          <TextField name="code" label="Code" placeholder="e.g. WIF" />
          <Select name="locationRole" label="Role" options={roleOptions} />
          <LocationSelector
            name="parentId"
            label="Parent Location"
            placeholder="None (root location)"
            clearable
            params={{ locationRoles: LocationRoleValues.ZONE }}
          />
        </div>
      </FormSection>

      <FormSection title="Attributes" description="Optional details about this location.">
        <div className="grid grid-cols-2 gap-4">
          <TextField name="area" label="Area" placeholder="e.g. 500 sq ft" />
          <UserSelector name="managerId" label="Manager" placeholder="Select manager" clearable />
        </div>
      </FormSection>

      <FormSection title="Status">
        <Switch name="isActive" label="Active" description="Enable this storage location" />
      </FormSection>

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
