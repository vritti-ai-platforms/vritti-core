import type { CreateResponse, SuccessResponse, TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCodeField, zodResolver } from '@vritti/quantum-ui/zod';
import type { Resolver } from 'react-hook-form';

// Geographic hierarchy levels a jurisdiction can occupy, broad to narrow.
export const TaxJurisdictionLevelValues = {
  COUNTRY: 'COUNTRY',
  STATE: 'STATE',
  COUNTY: 'COUNTY',
  CITY: 'CITY',
  DISTRICT: 'DISTRICT',
} as const;
export type TaxJurisdictionLevel = (typeof TaxJurisdictionLevelValues)[keyof typeof TaxJurisdictionLevelValues];

export const LEVELS = Object.values(TaxJurisdictionLevelValues) as [TaxJurisdictionLevel, ...TaxJurisdictionLevel[]];

export const LEVEL_LABELS: Record<TaxJurisdictionLevel, string> = {
  COUNTRY: 'Country',
  STATE: 'State',
  COUNTY: 'County',
  CITY: 'City',
  DISTRICT: 'District',
};

export const levelOptions = LEVELS.map((value) => ({ value, label: LEVEL_LABELS[value] }));

const _taxJurisdictionSchema = z.object({
  code: zodCodeField({ max: 50 }),
  name: z.string().min(1, 'Name is required').max(255),
  level: z.enum(LEVELS),
  parentId: z.string().uuid().optional().nullable(),
  countryCode: z.string().length(2, 'Country is required'),
  regionCode: z.string().max(10).optional(),
  taxUnion: z.string().max(50).optional(),
  isActive: z.boolean(),
});

export type TaxJurisdictionFormData = {
  code: string;
  name: string;
  level: TaxJurisdictionLevel;
  parentId?: string | null;
  countryCode: string;
  regionCode?: string;
  taxUnion?: string;
  isActive: boolean;
};

// Pre-typed resolver — casts once here so no `as any` leaks into components
export const taxJurisdictionFormResolver = zodResolver(_taxJurisdictionSchema) as unknown as Resolver<TaxJurisdictionFormData>;

export interface TaxJurisdictionData {
  id: string;
  code: string;
  name: string;
  level: TaxJurisdictionLevel;
  parentId: string | null;
  parentName: string | null;
  countryCode: string;
  regionCode: string | null;
  taxUnion: string | null;
  isActive: boolean;
  canDelete: boolean;
  hasChildren?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxJurisdictionTreeNode {
  id: string;
  name: string;
  level: TaxJurisdictionLevel;
  children?: TaxJurisdictionTreeNode[];
}

export interface TaxJurisdictionCountData {
  count: number;
}

export type TaxJurisdictionChildrenTableResponse = TableResponse<TaxJurisdictionData>;

export type TaxJurisdictionCreateResponse = CreateResponse<TaxJurisdictionData>;
export type { SuccessResponse };
