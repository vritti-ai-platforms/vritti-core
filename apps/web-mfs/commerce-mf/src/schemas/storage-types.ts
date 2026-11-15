import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCodeField, zodNumericField } from '@vritti/quantum-ui/zod';
import { fromBaseMeasure, MeasureValues, toBaseMeasure } from './measures';

export const StorageCapacityCheckValues = {
  NONE: 'NONE',
  WARN: 'WARN',
  BLOCK: 'BLOCK',
} as const;
export type StorageCapacityCheck = (typeof StorageCapacityCheckValues)[keyof typeof StorageCapacityCheckValues];

export const STORAGE_CAPACITY_CHECK_LABELS: Record<StorageCapacityCheck, string> = {
  [StorageCapacityCheckValues.NONE]: 'Not checked',
  [StorageCapacityCheckValues.WARN]: 'Warn',
  [StorageCapacityCheckValues.BLOCK]: 'Block',
};

export const STORAGE_CAPACITY_CHECK_DESCRIPTIONS: Record<StorageCapacityCheck, string> = {
  [StorageCapacityCheckValues.NONE]: 'Capacity, weight and volume are not checked at putaway',
  [StorageCapacityCheckValues.WARN]: 'Putaway goes ahead over the limits and records a warning',
  [StorageCapacityCheckValues.BLOCK]: 'Putaway is refused when it would go over the limits',
};

export const STORAGE_CAPACITY_CHECK_OPTIONS = Object.values(StorageCapacityCheckValues).map((value) => ({
  value,
  label: STORAGE_CAPACITY_CHECK_LABELS[value],
  description: STORAGE_CAPACITY_CHECK_DESCRIPTIONS[value],
}));

export interface StorageTypeData {
  id: string;
  code: string;
  name: string;
  maxWeight: number | null;
  maxVolume: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  capacityCheck: StorageCapacityCheck;
  allowMixedItems: boolean;
  allowMixedBatches: boolean;
  allowAdditionToStock: boolean;
  isActive: boolean;
  locationCount: number;
  itemCount: number;
}

export type StorageTypesTableResponse = TableResponse<StorageTypeData>;

const displayMeasure = zodNumericField({ nullable: true, positive: true });

export const storageTypeFormSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string({ error: 'Name is required' }).min(1, 'Name is required').max(255),
  maxWeight: displayMeasure,
  maxVolume: displayMeasure,
  length: displayMeasure,
  width: displayMeasure,
  height: displayMeasure,
  capacityCheck: z.enum(StorageCapacityCheckValues, { error: 'Capacity check is required' }),
  allowMixedItems: z.boolean(),
  allowMixedBatches: z.boolean(),
  allowAdditionToStock: z.boolean(),
  isActive: z.boolean(),
});

export type StorageTypeFormData = z.infer<typeof storageTypeFormSchema>;

export type CreateStorageTypePayload = Omit<StorageTypeData, 'id' | 'locationCount' | 'itemCount'>;
export type UpdateStorageTypePayload = Omit<CreateStorageTypePayload, 'code'>;

export const DEFAULT_STORAGE_TYPE_FORM: StorageTypeFormData = {
  code: '',
  name: '',
  maxWeight: null,
  maxVolume: null,
  length: null,
  width: null,
  height: null,
  capacityCheck: StorageCapacityCheckValues.BLOCK,
  allowMixedItems: true,
  allowMixedBatches: false,
  allowAdditionToStock: true,
  isActive: true,
};

// Turns the form's kg / L / cm limits into the g / ml / mm the API stores
export function toStorageTypePayload(form: StorageTypeFormData): CreateStorageTypePayload {
  return {
    ...form,
    maxWeight: toBaseMeasure(form.maxWeight, MeasureValues.WEIGHT),
    maxVolume: toBaseMeasure(form.maxVolume, MeasureValues.VOLUME),
    length: toBaseMeasure(form.length, MeasureValues.LENGTH),
    width: toBaseMeasure(form.width, MeasureValues.LENGTH),
    height: toBaseMeasure(form.height, MeasureValues.LENGTH),
  };
}

// Starts the edit form from a storage type, its limits shown in kg / L / cm
export function toStorageTypeForm(storageType: StorageTypeData): StorageTypeFormData {
  return {
    code: storageType.code,
    name: storageType.name,
    maxWeight: fromBaseMeasure(storageType.maxWeight, MeasureValues.WEIGHT),
    maxVolume: fromBaseMeasure(storageType.maxVolume, MeasureValues.VOLUME),
    length: fromBaseMeasure(storageType.length, MeasureValues.LENGTH),
    width: fromBaseMeasure(storageType.width, MeasureValues.LENGTH),
    height: fromBaseMeasure(storageType.height, MeasureValues.LENGTH),
    capacityCheck: storageType.capacityCheck,
    allowMixedItems: storageType.allowMixedItems,
    allowMixedBatches: storageType.allowMixedBatches,
    allowAdditionToStock: storageType.allowAdditionToStock,
    isActive: storageType.isActive,
  };
}
