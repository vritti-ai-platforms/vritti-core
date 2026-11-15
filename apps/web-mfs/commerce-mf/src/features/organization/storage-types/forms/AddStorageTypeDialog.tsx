import { Button } from '@vritti/quantum-ui/Button';
import { DialogActions } from '@vritti/quantum-ui/Dialog';
import { Form, FormSection } from '@vritti/quantum-ui/Form';
import { Select } from '@vritti/quantum-ui/Select';
import { Switch } from '@vritti/quantum-ui/Switch';
import { TextField } from '@vritti/quantum-ui/TextField';
import { zodResolver } from '@vritti/quantum-ui/zod';
import type React from 'react';
import { useForm } from 'react-hook-form';
import { useCreateStorageType } from '@/hooks/organization/storage-types';
import { DISPLAY_MEASURE_UNITS, MeasureValues } from '@/schemas/measures';
import {
  DEFAULT_STORAGE_TYPE_FORM,
  STORAGE_CAPACITY_CHECK_OPTIONS,
  type StorageTypeFormData,
  storageTypeFormSchema,
  toStorageTypePayload,
} from '@/schemas/storage-types';

interface AddStorageTypeDialogProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const WEIGHT_UNIT = DISPLAY_MEASURE_UNITS[MeasureValues.WEIGHT].symbol;
const VOLUME_UNIT = DISPLAY_MEASURE_UNITS[MeasureValues.VOLUME].symbol;
const LENGTH_UNIT = DISPLAY_MEASURE_UNITS[MeasureValues.LENGTH].symbol;

export const AddStorageTypeDialog: React.FC<AddStorageTypeDialogProps> = ({ onSuccess, onCancel }) => {
  const form = useForm<StorageTypeFormData>({
    resolver: zodResolver(storageTypeFormSchema),
    defaultValues: DEFAULT_STORAGE_TYPE_FORM,
  });

  const createMutation = useCreateStorageType({ onSuccess });

  return (
    <Form
      form={form}
      mutation={createMutation}
      resetOnSuccess
      onCancel={onCancel}
      transformSubmit={toStorageTypePayload}
    >
      <FormSection title="Details" contentClassName="block">
        <div className="grid grid-cols-2 gap-4">
          <TextField name="code" label="Code" placeholder="e.g. pallet-rack" description="It can't be changed later." />
          <TextField name="name" label="Name" placeholder="e.g. Pallet rack" />
        </div>
      </FormSection>

      <FormSection
        title="Limits"
        description="What one location of this type holds. Leave a limit blank when the type has none."
        contentClassName="block"
      >
        <div className="grid grid-cols-2 gap-4">
          <TextField
            name="maxWeight"
            label="Max Weight"
            type="number"
            positive
            placeholder="None"
            endAdornment={WEIGHT_UNIT}
          />
          <TextField
            name="maxVolume"
            label="Max Volume"
            type="number"
            positive
            placeholder="None"
            endAdornment={VOLUME_UNIT}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <TextField
            name="length"
            label="Inside Length"
            type="number"
            positive
            placeholder="None"
            endAdornment={LENGTH_UNIT}
          />
          <TextField
            name="width"
            label="Inside Width"
            type="number"
            positive
            placeholder="None"
            endAdornment={LENGTH_UNIT}
          />
          <TextField
            name="height"
            label="Inside Height"
            type="number"
            positive
            placeholder="None"
            endAdornment={LENGTH_UNIT}
          />
        </div>
      </FormSection>

      <FormSection title="Putaway Rules" contentClassName="block">
        <div className="flex flex-col gap-4">
          <Select
            name="capacityCheck"
            label="Capacity Check"
            placeholder="Select capacity check"
            options={STORAGE_CAPACITY_CHECK_OPTIONS}
          />
          <Switch name="allowMixedItems" label="Mixed Items" description="Different items may share one location" />
          <Switch
            name="allowMixedBatches"
            label="Mixed Batches"
            description="Different lots of the same item may share one location"
          />
          <Switch
            name="allowAdditionToStock"
            label="Addition to Stock"
            description="New stock may be added to a location that already holds the item"
          />
        </div>
      </FormSection>

      <FormSection title="Status" contentClassName="block">
        <Switch name="isActive" label="Active" description="Inactive storage types can't be given to locations" />
      </FormSection>

      <DialogActions>
        <Button type="button" variant="outline" data-cancel>
          Cancel
        </Button>
        <Button type="submit" loadingText="Creating...">
          Add Storage Type
        </Button>
      </DialogActions>
    </Form>
  );
};
