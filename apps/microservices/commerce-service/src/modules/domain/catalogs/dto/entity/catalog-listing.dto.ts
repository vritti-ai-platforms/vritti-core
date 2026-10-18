import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { type VariantFacet, type WorkspaceScope, workspaceScopeOf } from '@/db/schema';

export interface CatalogListingRow {
  id: string;
  catalogId: string;
  offeringVariantId: string;
  legalEntityId: string | null;
  siteId: string | null;
  isOwned: boolean;
  inventoryItemMrpId: string | null;
  code: string;
  offeringName: string;
  dimensions: VariantFacet[];
  attributes: VariantFacet[];
  isVariantActive: boolean;
  isOfferingActive: boolean;
  mrpAmount: bigint | null;
  mrpCurrencyCode: string | null;
  mrpUomSymbol: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  canEdit: boolean;
  price: CurrencyAmountDto;

  static from(row: CatalogListingPriceRow): CatalogListingPriceDto {
    const dto = new CatalogListingPriceDto();
    dto.id = row.id;
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.siteId = row.siteId ?? null;
    dto.ownerScope = workspaceScopeOf(row);
    dto.canEdit = row.isOwned;
    dto.price = CurrencyAmountDto.from(row.amount, row.currencyCode);
    return dto;
  }
}

export class CatalogListingDto {
  id: string;
  catalogId: string;
  offeringVariantId: string;
  code: string;
  // The offering's name — a variant has none of its own. What distinguishes it is in `dimensions`.
  offeringName: string;
  dimensions: VariantFacet[];
  attributes: VariantFacet[];
  isActive: boolean;
  availability: string;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: WorkspaceScope;
  canEdit: boolean;
  canDelete: boolean;
  inventoryItemMrpId: string | null;
  mrp: CurrencyAmountDto | null;
  mrpUomSymbol: string | null;
  excludedChannelIds: string[];
  prices: CatalogListingPriceDto[];
  createdAt: string;
  updatedAt: string;

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
  ): CatalogListingDto {
    const dto = new CatalogListingDto();
    dto.id = row.id;
    dto.catalogId = row.catalogId;
    dto.offeringVariantId = row.offeringVariantId;
    dto.code = row.code;
    dto.offeringName = row.offeringName;
    dto.dimensions = row.dimensions;
    dto.attributes = row.attributes;
    dto.isActive = row.isVariantActive && row.isOfferingActive;
    dto.availability = CatalogListingDto.availabilityOf(row, prices, excludedChannelIds, channelCount);
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.siteId = row.siteId ?? null;
    dto.ownerScope = workspaceScopeOf(row);
    dto.canEdit = row.isOwned;
    dto.canDelete = row.isOwned;
    dto.inventoryItemMrpId = row.inventoryItemMrpId ?? null;
    dto.mrp =
      row.mrpAmount != null && row.mrpCurrencyCode ? CurrencyAmountDto.from(row.mrpAmount, row.mrpCurrencyCode) : null;
    dto.mrpUomSymbol = row.mrpUomSymbol ?? null;
    dto.excludedChannelIds = excludedChannelIds;
    dto.prices = prices.map((price) => CatalogListingPriceDto.from(price));
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
