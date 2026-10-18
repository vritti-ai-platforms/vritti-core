import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { type VariantFacet, type WorkspaceScope, workspaceScopeOf } from '@/db/schema';

export interface CatalogListingRow {
  id: string;
  legalEntityId: string | null;
  siteId: string | null;
  isOwned: boolean;
  inventoryItemMrpId: string | null;
  code: string;
  offeringName: string;
  dimensions: VariantFacet[];
  isVariantActive: boolean;
  isOfferingActive: boolean;
  mrpAmount: bigint | null;
  mrpCurrencyCode: string | null;
}

export interface CatalogListingPriceRow {
  id: string;
  catalogListingId: string;
  currencyCode: string;
  amount: bigint;
  legalEntityId: string | null;
  siteId: string | null;
  isOwned: boolean;
}

export class CatalogListingPriceDto {
  id: string;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: WorkspaceScope;
  // False when it comes from a wider workspace: this one may override it but never edit it
  price: CurrencyAmountDto;

  static from(row: CatalogListingPriceRow): CatalogListingPriceDto {
    const dto = new CatalogListingPriceDto();
    dto.id = row.id;
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.siteId = row.siteId ?? null;
    dto.ownerScope = workspaceScopeOf(row);
    dto.price = CurrencyAmountDto.from(row.amount, row.currencyCode);
    return dto;
  }
}

export class CatalogListingDto {
  id: string;
  code: string;
  offeringName: string;
  dimensions: VariantFacet[];
  isActive: boolean;
  availability: string;
  channelCount: number;
  currencyCount: number;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: WorkspaceScope;
  canDelete: boolean;
  mrp: CurrencyAmountDto | null;
  excludedChannelIds: string[];
  prices: CatalogListingPriceDto[];

  // Says where a listing stands, deactivation first and the channel count last
  private static availabilityOf(
    row: CatalogListingRow,
    prices: CatalogListingPriceRow[],
    excludedChannelIds: string[],
    channelCount: number,
  ): string {
    if (!row.isOfferingActive) return 'Offering inactive';
    if (!row.isVariantActive) return 'Variant inactive';
    if (channelCount === 0) return 'No channels';
    if (prices.length === 0) return 'Not priced';
    return `${channelCount - excludedChannelIds.length} of ${channelCount}`;
  }

  static from(
    row: CatalogListingRow,
    prices: CatalogListingPriceRow[] = [],
    excludedChannelIds: string[] = [],
    channelCount = 0,
    currencyCount = 0,
  ): CatalogListingDto {
    const dto = new CatalogListingDto();
    dto.id = row.id;
    dto.code = row.code;
    dto.offeringName = row.offeringName;
    dto.dimensions = row.dimensions;
    dto.isActive = row.isVariantActive && row.isOfferingActive;
    dto.availability = CatalogListingDto.availabilityOf(row, prices, excludedChannelIds, channelCount);
    dto.channelCount = channelCount;
    dto.currencyCount = currencyCount;
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.siteId = row.siteId ?? null;
    dto.ownerScope = workspaceScopeOf(row);
    dto.canDelete = row.isOwned;
    dto.mrp =
      row.mrpAmount != null && row.mrpCurrencyCode ? CurrencyAmountDto.from(row.mrpAmount, row.mrpCurrencyCode) : null;
    dto.excludedChannelIds = excludedChannelIds;
    dto.prices = prices.map((price) => CatalogListingPriceDto.from(price));
    return dto;
  }
}
