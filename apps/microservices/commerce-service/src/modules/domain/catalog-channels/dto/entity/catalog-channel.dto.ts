import type { SalesChannelKind } from '@/db/schema';

export class CatalogChannelDto {
  id: string;
  catalogId: string;
  siteId: string;
  channelId: string;
  channelName: string;
  channelKind: SalesChannelKind;

  static from(row: {
    id: string;
    catalogId: string;
    siteId: string;
    channelId: string;
    channelName: string;
    channelKind: SalesChannelKind;
  }): CatalogChannelDto {
    const dto = new CatalogChannelDto();
    dto.id = row.id;
    dto.catalogId = row.catalogId;
    dto.siteId = row.siteId;
    dto.channelId = row.channelId;
    dto.channelName = row.channelName;
    dto.channelKind = row.channelKind;
    return dto;
  }
}
