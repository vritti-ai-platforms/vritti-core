import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodNumericField, zodResolver } from '@vritti/quantum-ui/zod';
import type { Resolver } from 'react-hook-form';

const _taxRateFormSchema = z.object({
  name: z.string().min(1, 'Rate name is required').max(100, 'Rate name cannot exceed 100 characters'),
  rate: zodNumericField({
    required: 'Rate is required',
    min: 0,
    max: 100,
    positive: true,
    positiveMessage: 'must be > 0',
  }),
});

const _taxGroupFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  isActive: z.boolean(),
  taxRates: z.array(_taxRateFormSchema).min(1, 'At least one tax rate is required'),
});

export type TaxRateFormData = {
  name: string;
  rate: number;
};

export type TaxGroupFormData = {
  name: string;
  isActive: boolean;
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
  isActive: boolean;
  canDelete: boolean;
}

export type TaxGroupsTableResponse = TableResponse<TaxGroupData>;

export interface CreateTaxGroupData {
  name: string;
  taxRates: Array<{
    name: string;
    rate: number;
  }>;
}

export type UpdateTaxGroupData = Partial<Pick<TaxGroupFormData, 'name' | 'taxRates' | 'isActive'>>;
