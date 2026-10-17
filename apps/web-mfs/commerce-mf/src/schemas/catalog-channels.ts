import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

export const CATALOG_CHANNEL_TYPES = ['APP', 'POS', 'B2B'] as const;
export type CatalogChannelType = (typeof CATALOG_CHANNEL_TYPES)[number];

export const CatalogChannelTypeValues = {
  APP: 'APP',
  POS: 'POS',
  B2B: 'B2B',
} as const satisfies Record<CatalogChannelType, CatalogChannelType>;

// slotLabel and gridLabel name the channel's own parts — never the workspace rendering them, because
// one set of components serves every scope
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

// The level an assignment was made at. Always comes from the row, never from the current workspace.
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

// One app or terminal. `catalog` is never null — a target with no row of its own carries the channel
// default, so nothing downstream has to fall back for itself.
export interface ChannelTargetData {
  targetId: string;
  name: string;
  catalog: ChannelCatalogData;
  isAssigned: boolean;
}

// targets is null for B2B, which names no target, and empty for POS above an outlet
export interface ChannelEntryData {
  type: CatalogChannelType;
  defaultCatalog: ChannelCatalogData | null;
  targets: ChannelTargetData[] | null;
}

// One channel carrying a catalog, as the catalog detail reads it — enough to name the channel, say
// which level set it, and decide whether this workspace may toggle a listing's visibility on it
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
  variantName: string;
  mrp: CurrencyValue | null;
  // Whether the channel carries it at all; per-currency withdrawals are on the Prices tab
  availableHere: boolean;
  // The currencies a shopper can buy it in here — priced, declared, and withheld from none
  availableCurrencyCodes: string[];
}

export interface ChannelPriceData {
  listingId: string;
  offeringVariantId: string;
  code: string;
  variantName: string;
  mrp: CurrencyValue | null;
  // Null when nobody priced it in this currency, which is why it is unavailable here
  price: CurrencyValue | null;
  priceOwnerScope: CatalogChannelOwnerScope | null;
  priceOwnerName: string | null;
  availableHere: boolean;
  // Withdrawn from the channel outright, so this currency's switch cannot help
  excludedOutright: boolean;
}

export type ChannelItemsTableResponse = TableResponse<ChannelItemData>;
export type ChannelPricesTableResponse = TableResponse<ChannelPriceData>;
