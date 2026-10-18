import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { VariantFacet } from '@/db/schema';

export interface WishlistItemRow {
  id: string;
  catalogListingId: string | null;
  offeringVariantId: string;
  amount: bigint | null;
  currencyCode: string | null;
  code: string;
  offeringName: string | null;
  dimensions: VariantFacet[];
  attributes: VariantFacet[];
  listingActive: boolean;
  variantActive: boolean;
  offeringActive: boolean;
  createdAt: Date;
}

export class WishlistItemDto {
  id: string;
  catalogListingId: string | null;
  // What a storefront joins its own product page on — see `CartItemDto` for why the variant
  offeringVariantId: string;
  // The offering's name — a variant has none of its own. What distinguishes it is in `dimensions`.
  name: string;
  code: string;
  dimensions: VariantFacet[];
  attributes: VariantFacet[];
  price: CurrencyAmountDto | null;
  // Whether it can still be bought
  isAvailable: boolean;
  createdAt: string;

  static from(row: WishlistItemRow): WishlistItemDto {
    const dto = new WishlistItemDto();
    dto.id = row.id;
    dto.catalogListingId = row.catalogListingId;
    dto.offeringVariantId = row.offeringVariantId;
    dto.name = row.offeringName ?? row.code;
    dto.dimensions = row.dimensions;
    dto.attributes = row.attributes;
    dto.code = row.code;
    dto.price = CurrencyAmountDto.from(row.amount, row.currencyCode ?? '');
    dto.isAvailable = row.listingActive && row.variantActive && row.offeringActive && row.amount != null;
    dto.createdAt = row.createdAt.toISOString();
    return dto;
  }
}

export class WishlistAddResultDto {
  // True when the row was already there, so the caller can say so rather than claiming a save
  alreadyExists: boolean;
  wishlistItems: WishlistItemDto[];

  static from(alreadyExists: boolean, wishlistItems: WishlistItemDto[]): WishlistAddResultDto {
    const dto = new WishlistAddResultDto();
    dto.alreadyExists = alreadyExists;
    dto.wishlistItems = wishlistItems;
    return dto;
  }
}

export class StaffWishlistItemDto extends WishlistItemDto {
  appId: string;

  static fromStaffRow(row: WishlistItemRow & { appId: string }): StaffWishlistItemDto {
    const dto = Object.assign(new StaffWishlistItemDto(), WishlistItemDto.from(row));
    dto.appId = row.appId;
    return dto;
  }
}
