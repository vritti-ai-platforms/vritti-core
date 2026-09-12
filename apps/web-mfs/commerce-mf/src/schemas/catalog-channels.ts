import type { TableResponse } from '@vritti/quantum-ui/types/api-response';
import { z } from '@vritti/quantum-ui/zod';

export const CATALOG_CHANNEL_TYPES = ['APP', 'POS', 'B2B'] as const;
export type CatalogChannelType = (typeof CATALOG_CHANNEL_TYPES)[number];

export const CHANNEL_TYPE_META: Record<CatalogChannelType, { label: string; description: string }> = {
  APP: { label: 'App', description: 'A storefront or integration calling through the SDK' },
  POS: { label: 'POS', description: 'A till at one of your outlets' },
  B2B: { label: 'B2B', description: 'The wholesale invoice generator' },
};

export const createCatalogChannelSchema = z.object({
  catalogId: z.string().uuid('Catalog is required'),
  type: z.enum(CATALOG_CHANNEL_TYPES),
  legalEntityId: z.string().uuid().nullable().optional(),
  siteId: z.string().uuid().nullable().optional(),
  appId: z.string().uuid().nullable().optional(),
  terminalId: z.string().uuid().nullable().optional(),
});

export const repointCatalogChannelSchema = z.object({
  catalogId: z.string().uuid('Catalog is required'),
});

export type CreateCatalogChannelFormData = z.infer<typeof createCatalogChannelSchema>;
export type RepointCatalogChannelFormData = z.infer<typeof repointCatalogChannelSchema>;

export interface CatalogChannelData {
  id: string;
  catalogId: string;
  catalogName: string | null;
  catalogIsActive: boolean;
  type: CatalogChannelType;
  legalEntityId: string | null;
  siteId: string | null;
  appId: string | null;
  terminalId: string | null;
  terminalName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ResolvedCatalogData {
  catalogId: string;
  catalogName: string;
  taxInclusive: boolean;
  channelId: string;
  matchedScope: 'SITE' | 'LEGAL_ENTITY' | 'ORGANIZATION';
  matchedTarget: boolean;
}

export type CatalogChannelsTableResponse = TableResponse<CatalogChannelData>;
