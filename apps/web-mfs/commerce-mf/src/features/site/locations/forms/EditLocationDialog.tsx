import { Badge } from '@vritti/quantum-ui/Badge';
import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { Undo2 } from 'lucide-react';
import type React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useUpdateLocation } from '@/hooks/site/locations';
import {
  type LocationData,
  type LocationFormData,
  LocationRoleLabels,
  LocationRoleValues,
  locationFormResolver,
  type UpdateLocationData,
} from '@/schemas/locations';
import { LocationSelector } from '@/selectors/location';
import { StorageTypeSelector } from '@/selectors/storage-type';
import { UserSelector } from '@/selectors/user';

interface EditLocationDialogProps {
  location: LocationData;
  onSuccess: () => void;
  onCancel: () => void;
}

// Sends only what changed about the storage type, so an untouched inherited type is never turned into an override
function storageTypeChanges(data: LocationFormData, location: LocationData): UpdateLocationData {
  if (data.inheritStorageType) return { inheritStorageType: true };
  const storageTypeId = data.storageTypeId ?? null;
  return storageTypeId === location.storageTypeId ? {} : { storageTypeId };
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
      storageTypeId: location.storageTypeId ?? undefined,
      inheritStorageType: false,
    },
  });

  const locationRole = useWatch({ control: form.control, name: 'locationRole' });
  const inheritStorageType = useWatch({ control: form.control, name: 'inheritStorageType' });
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
          ...storageTypeChanges(data, location),
        },
      })}
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
            clearable
            params={{ locationRoles: LocationRoleValues.ZONE }}
          />
        </div>
      </FormSection>

      <FormSection
        title="Storage"
        description="The kind of place this is, which sets its capacity limits and what may be stored in it."
        contentClassName="block"
      >
        <div className="flex flex-col gap-3">
          {inheritStorageType ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                On save, this location takes the type of the nearest zone above it that has one.
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => form.setValue('inheritStorageType', false, { shouldDirty: true })}
              >
                Keep Override
              </Button>
            </div>
          ) : (
            <StorageTypeSelector
              name="storageTypeId"
              clearable
              placeholder="No storage type"
              description={
                locationRole === LocationRoleValues.ZONE
                  ? 'Storage locations under this zone get this type unless they set their own.'
                  : undefined
              }
            />
          )}
          {!inheritStorageType && location.isStorageTypeOverridden && (
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Badge variant="outline">Overridden</Badge>
                Set on this location, not taken from its zone.
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                startAdornment={<Undo2 className="size-3.5" />}
                onClick={() => form.setValue('inheritStorageType', true, { shouldDirty: true })}
              >
                Use Inherited
              </Button>
            </div>
          )}
          {!location.isStorageTypeOverridden && location.inheritedFromLocationName && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">Inherited</Badge>
              From {location.inheritedFromLocationName}. Picking a different type overrides it.
            </span>
          )}
        </div>
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
        <Button type="submit" loadingText="Saving...">
          Save Changes
        </Button>
      </DialogActions>
    </Form>
  );
};
