import type { CatalogChannelType } from '@/db/schema';

export interface CatalogChannelRow {
  id: string;
  catalogId: string;
  catalogName: string | null;
  catalogIsActive: boolean | null;
  type: CatalogChannelType;
  legalEntityId: string | null;
  siteId: string | null;
  appId: string | null;
  terminalId: string | null;
  terminalName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class CatalogChannelDto {
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

  static from(row: CatalogChannelRow): CatalogChannelDto {
    const dto = new CatalogChannelDto();
    dto.id = row.id;
    dto.catalogId = row.catalogId;
    dto.catalogName = row.catalogName ?? null;
    dto.catalogIsActive = row.catalogIsActive ?? false;
    dto.type = row.type;
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.siteId = row.siteId ?? null;
    dto.appId = row.appId ?? null;
    dto.terminalId = row.terminalId ?? null;
    dto.terminalName = row.terminalName ?? null;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}

export class ResolvedCatalogDto {
  catalogId: string;
  catalogName: string;
  taxInclusive: boolean;
  channelId: string;
  matchedScope: 'SITE' | 'LEGAL_ENTITY' | 'ORGANIZATION';
  matchedTarget: boolean;
}
