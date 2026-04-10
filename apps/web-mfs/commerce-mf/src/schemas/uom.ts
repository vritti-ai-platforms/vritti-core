import { zodResolver } from '@hookform/resolvers/zod';
import type { CreateResponse } from '@vritti/quantum-ui/api-response';
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';

// Base unit form — name + symbol only
const _baseUnitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  symbol: z.string().min(1, 'Symbol is required').max(10),
});

// Derived unit form — name + symbol + conversion factor
const _derivedUnitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  symbol: z.string().min(1, 'Symbol is required').max(10),
  conversionFactor: z.coerce.number().positive('Must be greater than 0'),
});

export type BaseUnitFormData = { name: string; symbol: string };
export type DerivedUnitFormData = { name: string; symbol: string; conversionFactor: number };

export const baseUnitFormResolver = zodResolver(_baseUnitSchema) as unknown as Resolver<BaseUnitFormData>;
export const derivedUnitFormResolver = zodResolver(_derivedUnitSchema) as unknown as Resolver<DerivedUnitFormData>;

export type CreateUomResponse = CreateResponse<UomData>;

export interface UomData {
  id: string;
  name: string;
  symbol: string;
  baseUnitId: string | null;
  baseUnitSymbol: string | null;
  conversionFactor: number;
  canDelete: boolean;
  createdAt: string;
}
