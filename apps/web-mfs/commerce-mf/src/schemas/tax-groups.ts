import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';

export const taxRateTypeValues = ['inclusive', 'exclusive'] as const;
export type TaxRateType = (typeof taxRateTypeValues)[number];

const _taxRateFormSchema = z.object({
  name: z.string().min(1, 'Rate name is required').max(100, 'Rate name cannot exceed 100 characters'),
  rate: z.coerce.number().min(0, 'Rate must be at least 0').max(100, 'Rate cannot exceed 100'),
  type: z.enum(taxRateTypeValues),
});

const _taxGroupFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0, 'Sort order cannot be negative'),
  taxRates: z.array(_taxRateFormSchema).min(1, 'At least one tax rate is required'),
});

export type TaxRateFormData = {
  name: string;
  rate: number;
  type: TaxRateType;
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
  type: TaxRateType;
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
    type: TaxRateType;
  }>;
  isDefault?: boolean;
}

export type UpdateTaxGroupData = Partial<
  Pick<TaxGroupFormData, 'name' | 'taxRates' | 'isDefault' | 'isActive' | 'sortOrder'>
>;
