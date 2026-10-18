import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z, zodCurrencyField } from '@vritti/quantum-ui/zod';
import type { VariantFacet } from './variant-facets';

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

export type AddCatalogListingItem = z.infer<typeof addCatalogListingSchema>;

// One row of the page: a variant, the MRPs it is being listed at, and a price slot for each of them.
// An empty mrpIds means one listing covering any batch, which is what `rows` then holds a single entry for.
export const addCatalogListingVariantSchema = z.object({
  offeringVariantId: z.string().uuid(),
  mrpIds: z.array(z.string().uuid()),
  rows: z
    .array(
      z.object({
        inventoryItemMrpId: z.string().uuid().nullable(),
        price: zodCurrencyField({ positive: true }).optional(),
      }),
    )
    .min(1),
});

// Only the last step of the Add Listings wizard is a form. The offering, the variants and the currency are
// choices the steps before it made — they decide which rows exist here, and are never submitted themselves.
export const catalogListingPricesFormSchema = z.object({
  variants: z.array(addCatalogListingVariantSchema).min(1, 'Pick at least one variant'),
});

export type CatalogListingPricesFormShape = z.infer<typeof catalogListingPricesFormSchema>;

export const setCatalogListingPriceSchema = z.object({
  price: zodCurrencyField({ positive: true }),
});

export type SetCatalogListingPriceFormData = z.infer<typeof setCatalogListingPriceSchema>;

export const bulkSetListingPriceSchema = z.object({
  currencyCode: z.string().min(1, 'Currency is required'),
  price: zodCurrencyField({ positive: true }),
});

export type BulkSetListingPriceFormData = z.infer<typeof bulkSetListingPriceSchema>;

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
  offeringName: string;
  dimensions: VariantFacet[];
  attributes: VariantFacet[];
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
