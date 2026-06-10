import { z, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type { Resolver } from 'react-hook-form';

const _taxRateFormSchema = z.object({
  name: z.string().min(1, 'Rate name is required').max(100, 'Rate name cannot exceed 100 characters'),
  rate: zodNumericField({ required: 'Rate is required', min: 0, max: 100 }),
});

const _taxGroupFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  sortOrder: zodNumericField({ required: 'Sort order is required', min: 0 }),
  taxRates: z.array(_taxRateFormSchema).min(1, 'At least one tax rate is required'),
});

export type TaxRateFormData = {
  name: string;
  rate: number;
};

export type TaxGroupFormData = {
  name: string;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  taxRates: TaxRateFormData[];
};

export const taxGroupFormResolver = zodResolver(_taxGroupFormSchema) as unknown as Resolver<TaxGroupFormData>;

export interface TaxRateData {
  id: string;
  name: string;
  rate: number;
  sortOrder: number;
}

export interface TaxGroupData {
  id: string;
  name: string;
  taxRates: TaxRateData[];
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateTaxGroupData {
  name: string;
  taxRates: Array<{
    name: string;
    rate: number;
  }>;
  isDefault?: boolean;
}

export type UpdateTaxGroupData = Partial<
  Pick<TaxGroupFormData, 'name' | 'taxRates' | 'isDefault' | 'isActive' | 'sortOrder'>
>;
