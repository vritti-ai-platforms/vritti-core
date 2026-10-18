import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { CatalogChannelType, CatalogFilterMode } from '@/db/schema';
import { type WorkspaceScope, workspaceScopeOf } from '@/db/schema';

export type ChannelScope = 'SITE' | 'LEGAL_ENTITY' | 'ORGANIZATION';

const scopeOf = (row: CatalogChannelRow): ChannelScope =>
  row.siteId ? 'SITE' : row.legalEntityId ? 'LEGAL_ENTITY' : 'ORGANIZATION';

export interface CatalogChannelRow {
  id: string;
  catalogId: string;
  catalogName: string;
  catalogIsActive: boolean;
  catalogTaxInclusive: boolean;
  catalogFilterMode: CatalogFilterMode;
  type: CatalogChannelType;
  legalEntityId: string | null;
  siteId: string | null;
  appId: string | null;
  terminalId: string | null;
  terminalName: string | null;
  isOwn: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelListRow extends CatalogChannelRow {
  itemsTotal: number;
  itemsAvailable: number;
}

export class ChannelCatalogDto {
  channelId: string;
  catalogId: string;
  catalogName: string;
  catalogIsActive: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: 'ORG' | 'LE' | 'SITE';
  isOwn: boolean;
  itemsTotal: number;
  itemsAvailable: number;

  static from(row: ChannelListRow): ChannelCatalogDto {
    const dto = new ChannelCatalogDto();
    dto.channelId = row.id;
    dto.catalogId = row.catalogId;
    dto.catalogName = row.catalogName;
    dto.catalogIsActive = row.catalogIsActive;
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.siteId = row.siteId ?? null;
    dto.ownerScope = workspaceScopeOf(row);
    dto.isOwn = row.isOwn;
    dto.itemsTotal = row.itemsTotal;
    dto.itemsAvailable = row.itemsAvailable;
    return dto;
  }
}

export const DEFAULT_SLOT = 'default';

export type ResolvedChannelsDto = Record<string, Record<string, ChannelCatalogDto>>;

export class CatalogChannelDto {
  id: string;
  catalogId: string;
  catalogName: string;
  catalogIsActive: boolean;
  type: CatalogChannelType;
  isFallback: boolean;
  legalEntityId: string | null;
  siteId: string | null;
  appId: string | null;
  terminalId: string | null;
  terminalName: string | null;
  isOwn: boolean;
  setAt: ChannelScope;
  createdAt: string;
  updatedAt: string;

  static from(row: CatalogChannelRow): CatalogChannelDto {
    const dto = new CatalogChannelDto();
    dto.id = row.id;
    dto.catalogId = row.catalogId;
    dto.catalogName = row.catalogName;
    dto.catalogIsActive = row.catalogIsActive;
    dto.type = row.type;
    dto.isFallback = !row.appId && !row.terminalId;
    dto.legalEntityId = row.legalEntityId ?? null;
    dto.siteId = row.siteId ?? null;
    dto.appId = row.appId ?? null;
    dto.terminalId = row.terminalId ?? null;
    dto.terminalName = row.terminalName ?? null;
    dto.isOwn = row.isOwn;
    dto.setAt = scopeOf(row);
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}

export interface ChannelItemRow {
  listingId: string;
  offeringVariantId: string;
  code: string;
  variantName: string;
  mrpAmount: bigint | null;
  mrpCurrencyCode: string | null;
  availableHere: boolean;
  availableCurrencyCodes: string[];
}

export interface ChannelPriceRow {
  listingId: string;
  offeringVariantId: string;
  code: string;
  variantName: string;
  mrpAmount: bigint | null;
  mrpCurrencyCode: string | null;
  priceAmount: bigint | null;
  priceCurrencyCode: string | null;
  priceLegalEntityId: string | null;
  priceSiteId: string | null;
  availableHere: boolean;
  excludedOutright: boolean;
}

export class ChannelItemDto {
  listingId: string;
  offeringVariantId: string;
  code: string;
  variantName: string;
  mrp: CurrencyAmountDto | null;
  // Whether the channel carries it at all. Prices and per-currency exclusions are the Prices tab.
  availableHere: boolean;
  // The currencies a shopper can buy it in here — priced, declared, and withheld from none
  availableCurrencyCodes: string[];

  static from(row: ChannelItemRow): ChannelItemDto {
    const dto = new ChannelItemDto();
    dto.listingId = row.listingId;
    dto.offeringVariantId = row.offeringVariantId;
    dto.code = row.code;
    dto.variantName = row.variantName;
    dto.mrp =
      row.mrpAmount != null && row.mrpCurrencyCode ? CurrencyAmountDto.from(row.mrpAmount, row.mrpCurrencyCode) : null;
    dto.availableHere = row.availableHere;
    dto.availableCurrencyCodes = row.availableCurrencyCodes;
    return dto;
  }
}

export class ChannelPriceDto {
  listingId: string;
  offeringVariantId: string;
  code: string;
  variantName: string;
  mrp: CurrencyAmountDto | null;
  // Null when nobody priced it in this currency, which is why it is unavailable here
  price: CurrencyAmountDto | null;
  priceOwnerScope: WorkspaceScope | null;
  priceLegalEntityId: string | null;
  priceSiteId: string | null;
  availableHere: boolean;
  // True when the listing is excluded from the channel outright, so this currency's switch is moot
  excludedOutright: boolean;

  static from(row: ChannelPriceRow): ChannelPriceDto {
    const dto = new ChannelPriceDto();
    dto.listingId = row.listingId;
    dto.offeringVariantId = row.offeringVariantId;
    dto.code = row.code;
    dto.variantName = row.variantName;
    dto.mrp =
      row.mrpAmount != null && row.mrpCurrencyCode ? CurrencyAmountDto.from(row.mrpAmount, row.mrpCurrencyCode) : null;
    dto.price =
      row.priceAmount != null && row.priceCurrencyCode
        ? CurrencyAmountDto.from(row.priceAmount, row.priceCurrencyCode)
        : null;
    dto.priceOwnerScope =
      row.priceAmount == null
        ? null
        : workspaceScopeOf({ legalEntityId: row.priceLegalEntityId, siteId: row.priceSiteId });
    dto.priceLegalEntityId = row.priceLegalEntityId ?? null;
    dto.priceSiteId = row.priceSiteId ?? null;
    dto.availableHere = row.availableHere;
    dto.excludedOutright = row.excludedOutright;
    return dto;
  }
}

export class ResolvedCatalogDto {
  catalogId: string;
  catalogName: string;
  taxInclusive: boolean;
  channelId: string;
  matchedScope: ChannelScope;
  matchedTarget: boolean;

  static from(row: CatalogChannelRow): ResolvedCatalogDto {
    const dto = new ResolvedCatalogDto();
    dto.catalogId = row.catalogId;
    dto.catalogName = row.catalogName;
    dto.taxInclusive = row.catalogTaxInclusive;
    dto.channelId = row.id;
    dto.matchedScope = scopeOf(row);
    dto.matchedTarget = Boolean(row.appId || row.terminalId);
    return dto;
  }
}
