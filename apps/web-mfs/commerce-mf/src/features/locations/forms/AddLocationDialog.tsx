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
import { useCreateLocation } from '@/hooks/locations';
import {
  type LocationFormData,
  LocationRoleLabels,
  LocationRoleValues,
  locationFormResolver,
} from '@/schemas/locations';

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

  const createMutation = useCreateLocation({ onSuccess });

  return (
    <Form form={form} mutation={createMutation} resetOnSuccess onCancel={onCancel}>
      <FormSection title="Details" description="What the location is and where it sits in the hierarchy.">
        <div className="grid grid-cols-2 gap-4">
          <TextField name="name" label="Name" placeholder="e.g. Walk-in Fridge" />
          <TextField name="code" label="Code" placeholder="e.g. WIF" />
          <Select name="locationRole" label="Role" options={roleOptions} />
          <LocationSelector
            name="parentId"
            label="Parent Location"
            placeholder="None (root location)"
            clearable={!isParentLocked}
            disabled={isParentLocked}
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
        <Button type="submit" loadingText="Creating...">
          Add Location
        </Button>
      </DialogActions>
    </Form>
  );
};
