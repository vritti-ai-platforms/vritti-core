import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

export const CATALOG_CHANNEL_TYPES = ['APP', 'POS', 'B2B'] as const;
export type CatalogChannelType = (typeof CATALOG_CHANNEL_TYPES)[number];

// slotLabel and gridLabel name the channel's own parts — never the workspace rendering them, because
// one set of components serves every scope
export const CHANNEL_TYPE_META: Record<
  CatalogChannelType,
  { label: string; description: string; slotLabel: string; gridLabel: string | null }
> = {
  APP: {
    label: 'App',
    description: 'Storefronts and integrations calling the SDK',
    slotLabel: 'Default for all apps',
    gridLabel: 'Apps',
  },
  POS: {
    label: 'POS',
    description: 'Billing terminals at your outlets',
    slotLabel: 'Default for all terminals',
    gridLabel: 'Terminals',
  },
  B2B: {
    label: 'B2B',
    description: 'Wholesale invoicing',
    slotLabel: 'Wholesale catalog',
    gridLabel: null,
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

export interface ChannelAssignmentData {
  channelId: string;
  catalogId: string;
  catalogName: string | null;
  catalogIsActive: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: ChannelOwnerScope;
  ownerName: string;
  isOwn: boolean;
  itemsTotal: number;
  itemsSelling: number;
}

// One app or terminal. A null assignment means it follows the channel default.
export interface ChannelTargetData {
  targetId: string;
  name: string;
  assignment: ChannelAssignmentData | null;
}

// targets is null for B2B, which names no target, and empty for POS above an outlet
export interface ChannelScreenEntryData {
  type: CatalogChannelType;
  defaultAssignment: ChannelAssignmentData | null;
  targets: ChannelTargetData[] | null;
}

// One channel row, as the catalog detail's Channels tab reads it — that view is per-catalog and
// unchanged by the channels screen, which works per workspace instead.
export interface CatalogChannelData {
  id: string;
  catalogId: string;
  catalogName: string | null;
  catalogIsActive: boolean;
  type: CatalogChannelType;
  isFallback: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  appId: string | null;
  terminalId: string | null;
  terminalName: string | null;
  isOwn: boolean;
  itemsTotal: number;
  itemsSelling: number;
  createdAt: string;
  updatedAt: string;
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
