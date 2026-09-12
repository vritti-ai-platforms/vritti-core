import type { CurrencyValue } from '@vritti/quantum-ui/currency';
import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

export const CATALOG_CHANNEL_TYPES = ['APP', 'POS', 'B2B'] as const;
export type CatalogChannelType = (typeof CATALOG_CHANNEL_TYPES)[number];

export const CHANNEL_TYPE_META: Record<CatalogChannelType, { label: string; description: string }> = {
  APP: { label: 'App', description: 'A storefront or integration calling through the SDK' },
  POS: { label: 'POS', description: 'A till at one of your outlets' },
  B2B: { label: 'B2B', description: 'The wholesale invoice generator' },
};

export type ChannelScope = 'SITE' | 'LEGAL_ENTITY' | 'ORGANIZATION';

export const SCOPE_LABEL: Record<ChannelScope, string> = {
  SITE: 'outlet',
  LEGAL_ENTITY: 'company',
  ORGANIZATION: 'organization',
};

export const SCOPE_TITLE: Record<ChannelScope, string> = {
  SITE: 'Outlet',
  LEGAL_ENTITY: 'Company',
  ORGANIZATION: 'Organization',
};

export const addAppChannelSchema = z.object({
  catalogId: z.string().uuid('Catalog is required'),
  appId: z.string().uuid().nullable().optional(),
});

export type AddAppChannelFormData = z.infer<typeof addAppChannelSchema>;

export const editAppChannelSchema = z.object({
  catalogId: z.string().uuid('Catalog is required'),
});

export type EditAppChannelFormData = z.infer<typeof editAppChannelSchema>;

export interface CatalogChannelData {
  id: string;
  catalogId: string;
  catalogName: string | null;
  catalogIsActive: boolean;
  type: CatalogChannelType;
  label: string;
  isFallback: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  appId: string | null;
  terminalId: string | null;
  terminalName: string | null;
  isOwn: boolean;
  setAt: ChannelScope;
  itemsTotal: number;
  itemsSelling: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelOverviewData {
  type: CatalogChannelType;
  catalogId: string | null;
  catalogName: string | null;
  catalogIsActive: boolean | null;
  isOverride: boolean;
  inheritedFrom: ChannelScope | null;
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
export type CatalogChannelsTableResponse = TableResponse<CatalogChannelData>;
