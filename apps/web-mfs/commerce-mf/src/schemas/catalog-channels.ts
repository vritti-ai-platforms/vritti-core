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
  { label: string; description: string; slotLabel: string; gridLabel: string | null; emptyNote: string }
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
    description: 'Wholesale invoicing',
    slotLabel: 'Wholesale catalog',
    gridLabel: null,
    emptyNote: 'B2B names no individual target, so this is the single wholesale assignment for this level.',
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
  itemsSelling: number;
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

// One channel selling a catalog, as the catalog detail reads it — enough to name the channel, say
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

export interface ChannelItemData {
  listingId: string;
  offeringVariantId: string;
  sku: string | null;
  variantName: string | null;
  mrp: CurrencyValue | null;
  price: CurrencyValue | null;
  sellsHere: boolean;
}

export type ChannelItemsTableResponse = TableResponse<ChannelItemData>;
