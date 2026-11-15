import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { omit } from '@vritti/quantum-ui/lodash';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useCreateLocation } from '@/hooks/site/locations';
import {
  type LocationFormData,
  LocationRoleLabels,
  LocationRoleValues,
  locationFormResolver,
} from '@/schemas/locations';
import { LocationSelector } from '@/selectors/location';
import { StorageTypeSelector } from '@/selectors/storage-type';
import { UserSelector } from '@/selectors/user';

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
      locationRole: LocationRoleValues.STORAGE,
      isActive: true,
      area: '',
      inheritStorageType: false,
    },
  });

  const locationRole = useWatch({ control: form.control, name: 'locationRole' });

  const createMutation = useCreateLocation({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={(data) => {
        const payload = omit(data, ['storageTypeId', 'inheritStorageType']);
        return data.storageTypeId ? { ...payload, storageTypeId: data.storageTypeId } : payload;
      }}
    >
      <FormSection
        title="Details"
        description="What the location is and where it sits in the hierarchy."
        contentClassName="block"
      >
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

      <FormSection
        title="Storage"
        description="The kind of place this is, which sets its capacity limits and what may be stored in it."
        contentClassName="block"
      >
        <StorageTypeSelector
          name="storageTypeId"
          clearable
          placeholder="Inherit from the parent zone"
          description={
            locationRole === LocationRoleValues.ZONE
              ? 'Storage locations under this zone get this type unless they set their own.'
              : "Leave empty to take the type of the nearest zone above it that has one. Picking a type overrides the zone's."
          }
        />
      </FormSection>

      <FormSection title="Attributes" description="Optional details about this location." contentClassName="block">
        <div className="grid grid-cols-2 gap-4">
          <TextField name="area" label="Area" placeholder="e.g. 500 sq ft" />
          <UserSelector name="managerId" label="Manager" placeholder="Select manager" clearable />
        </div>
      </FormSection>

      <FormSection title="Status" contentClassName="block">
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
