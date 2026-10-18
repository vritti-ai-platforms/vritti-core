import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField } from '@vritti/quantum-ui/zod';

export const createCatalogSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be at most 255 characters'),
  taxInclusive: z.boolean(),
});

export const updateCatalogSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255).optional(),
  taxInclusive: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCatalogFormData = z.infer<typeof createCatalogSchema>;
export type UpdateCatalogFormData = z.infer<typeof updateCatalogSchema>;

export const addCatalogListingSchema = z.object({
  offeringVariantId: z.string().uuid('Variant is required'),
  inventoryItemMrpId: z.string().uuid().nullable().optional(),
  price: zodCurrencyField({ positive: true }).optional(),
});

export type AddCatalogListingFormData = z.infer<typeof addCatalogListingSchema>;

// The offering scopes the variant picker but is never submitted — variants carry their own offering
export const addCatalogListingFormSchema = addCatalogListingSchema.extend({
  offeringId: z.string().uuid('Offering is required'),
});

export type AddCatalogListingFormShape = z.infer<typeof addCatalogListingFormSchema>;

export const setCatalogListingPriceSchema = z.object({
  price: zodCurrencyField({ positive: true }),
});

export type SetCatalogListingPriceFormData = z.infer<typeof setCatalogListingPriceSchema>;

export const addCatalogCurrencySchema = z.object({
  currencyCode: z.string().min(1, 'Currency is required'),
});

export type AddCatalogCurrencyFormData = z.infer<typeof addCatalogCurrencySchema>;

export type CatalogOwnerScope = 'ORG' | 'LE' | 'SITE';

export interface CatalogData {
  id: string;
  name: string;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: CatalogOwnerScope;
  ownerName: string;
  taxInclusive: boolean;
  isActive: boolean;
  listingCount: number;
  channelCount: number;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogListingPriceData {
  id: string;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: CatalogOwnerScope;
  ownerName: string;
  canEdit: boolean;
  price: CurrencyValue;
}

export interface CatalogListingData {
  id: string;
  catalogId: string;
  offeringVariantId: string;
  code: string;
  variantName: string;
  isActive: boolean;
  availability: string;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: CatalogOwnerScope;
  ownerName: string;
  canEdit: boolean;
  canDelete: boolean;
  inventoryItemMrpId: string | null;
  mrp: CurrencyValue | null;
  mrpUomSymbol: string | null;
  excludedChannelIds: string[];
  prices: CatalogListingPriceData[];
  createdAt: string;
  updatedAt: string;
}

export interface CatalogCurrencyData {
  currencyCode: string;
  pricedCount: number;
  listingCount: number;
}

export type CatalogsTableResponse = TableResponse<CatalogData>;
export type CatalogListingsTableResponse = TableResponse<CatalogListingData>;
