import type { CatalogChannelType } from '@/db/schema';

/**
 * One channel selling this catalog, as the catalog detail page reads it.
 *
 * The channels domain owns the table and its own richer shape; this is the narrower projection a
 * catalog needs — enough to name each channel, say which level set it, and decide whether this
 * workspace may toggle a listing's visibility on it.
 */
export class CatalogChannelDto {
  id: string;
  type: CatalogChannelType;
  appId: string | null;
  terminalId: string | null;
  terminalName: string | null;
  legalEntityId: string | null;
  siteId: string | null;
  isOwn: boolean;

  static from(row: CatalogChannelDto): CatalogChannelDto {
    const dto = new CatalogChannelDto();
    dto.id = row.id;
    dto.type = row.type;
    dto.appId = row.appId ?? null;
    dto.terminalId = row.terminalId ?? null;
    dto.terminalName = row.terminalName ?? null;
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.siteId = row.siteId ?? null;
    dto.isOwn = row.isOwn;
    return dto;
  }
}
