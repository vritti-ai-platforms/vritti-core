import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';
import type { VariantFacet } from './variant-facets';

export const CATALOG_CHANNEL_TYPES = ['APP', 'POS', 'B2B'] as const;
export type CatalogChannelType = (typeof CATALOG_CHANNEL_TYPES)[number];

export const CatalogChannelTypeValues = {
  APP: 'APP',
  POS: 'POS',
  B2B: 'B2B',
} as const satisfies Record<CatalogChannelType, CatalogChannelType>;

// slotLabel and gridLabel name the channel's own parts — never the workspace rendering them, because one set of
// components serves every scope
export const CHANNEL_TYPE_META: Record<
  CatalogChannelType,
  { label: string; description: string; slotLabel: string; gridLabel: string; emptyNote: string }
> = {
  APP: {
    label: 'App',
    description: 'Storefronts and integrations calling the SDK',
    slotLabel: 'Default for all apps',
    gridLabel: 'Apps',
    emptyNote: 'No apps are registered yet. Every app you add will use the default above.',
  },
  POS: {
    label: 'POS',
    description: 'Billing terminals at your outlets',
    slotLabel: 'Default for all terminals',
    gridLabel: 'Terminals',
    emptyNote:
      'Terminals belong to an outlet, so they are listed only in an outlet workspace. This level sets the default they use.',
  },
  B2B: {
    label: 'B2B',
    description: 'Wholesale sites, for buyers that are companies',
    slotLabel: 'Default for all wholesale sites',
    gridLabel: 'Sites',
    emptyNote: 'No apps are registered yet. Every app you add offers this to company buyers.',
  },
};

export type ChannelOwnerScope = 'ORG' | 'LE' | 'SITE';

export const OWNER_SCOPE_LABEL: Record<ChannelOwnerScope, string> = {
  ORG: 'Organization',
  LE: 'Company',
  SITE: 'Outlet',
};

export const assignCatalogSchema = z.object({
  catalogId: z.string().uuid('Catalog is required'),
});

export type AssignCatalogFormData = z.infer<typeof assignCatalogSchema>;

export interface ChannelCatalogData {
  channelId: string;
  catalogId: string;
  catalogName: string;
  catalogIsActive: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: ChannelOwnerScope;
  ownerName: string;
  isOwn: boolean;
  itemsTotal: number;
  itemsAvailable: number;
}

export interface ChannelTargetData {
  targetId: string;
  name: string;
  catalog: ChannelCatalogData;
  isAssigned: boolean;
}

export interface ChannelEntryData {
  type: CatalogChannelType;
  defaultCatalog: ChannelCatalogData | null;
  targets: ChannelTargetData[] | null;
}

export interface CatalogChannelData {
  id: string;
  type: CatalogChannelType;
  appId: string | null;
  terminalId: string | null;
  terminalName: string | null;
  legalEntityId: string | null;
  siteId: string | null;
  isOwn: boolean;
}

export type CatalogChannelOwnerScope = 'ORG' | 'LE' | 'SITE';

export interface ChannelItemData {
  listingId: string;
  offeringVariantId: string;
  code: string;
  offeringName: string;
  dimensions: VariantFacet[];
  attributes: VariantFacet[];
  mrp: CurrencyValue | null;
  availableHere: boolean;
  availableCurrencyCodes: string[];
}

export interface ChannelPriceData {
  listingId: string;
  offeringVariantId: string;
  code: string;
  offeringName: string;
  dimensions: VariantFacet[];
  attributes: VariantFacet[];
  mrp: CurrencyValue | null;
  price: CurrencyValue | null;
  priceOwnerScope: CatalogChannelOwnerScope | null;
  priceOwnerName: string | null;
  availableHere: boolean;
  excludedOutright: boolean;
}

export type ChannelItemsTableResponse = TableResponse<ChannelItemData>;
export type ChannelPricesTableResponse = TableResponse<ChannelPriceData>;
