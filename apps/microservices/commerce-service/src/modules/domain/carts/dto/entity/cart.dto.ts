import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export interface CartTableRow {
  id: string;
  organizationId: string;
  legalEntityId: string;
  siteId: string | null;
  partyId: string;
  partyName: string;
  checkoutStartedAt: Date | null;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItemRow {
  id: string;
  // Null once the catalogue stops carrying it — the line stays, as `isAvailable` explains
  catalogListingId: string | null;
  offeringVariantId: string;
  quantity: number;
  // Null when the catalogue holds no price for the basket's currency — see `CartItemDto.from`
  amount: bigint | null;
  currencyCode: string | null;
  sku: string | null;
  variantName: string | null;
  offeringName: string | null;
  listingActive: boolean;
  variantActive: boolean;
  offeringActive: boolean;
  createdAt: Date;
}

export class CartItemDto {
  id: string;
  // Null once the catalogue stops carrying it — the line stays, as `isAvailable` explains
  catalogListingId: string | null;
  // What a storefront joins its own product page on
  offeringVariantId: string;
  quantity: number;
  name: string;
  sku: string | null;
  // Null when nothing in the catalogue prices this listing in the basket's currency
  unitPrice: CurrencyAmountDto | null;
  lineTotal: CurrencyAmountDto | null;
  // Whether this line can still be bought
  isAvailable: boolean;

  static from(row: CartItemRow): CartItemDto {
    const dto = new CartItemDto();
    dto.id = row.id;
    dto.catalogListingId = row.catalogListingId;
    dto.offeringVariantId = row.offeringVariantId;
    dto.quantity = row.quantity;
    dto.name = row.variantName ?? row.offeringName ?? '';
    dto.sku = row.sku ?? null;

    const priced = row.amount != null && row.currencyCode != null;
    dto.unitPrice = priced ? CurrencyAmountDto.from(row.amount as bigint, row.currencyCode as string) : null;
    dto.lineTotal = priced ? CurrencyAmountDto.from(lineMinor(row) as bigint, row.currencyCode as string) : null;

    // An unpriced line counts as unavailable: it can be shown, but nothing can be charged for it.
    dto.isAvailable = row.listingActive && row.variantActive && row.offeringActive && priced;
    return dto;
  }
}

// Whether a line is sellable — the same rule `CartItemDto` reports as `isAvailable`
function isAvailable(row: CartItemRow): boolean {
  return row.listingActive && row.variantActive && row.offeringActive && row.amount != null;
}

// A line's total in minor units
function lineMinor(row: CartItemRow): bigint | null {
  return row.amount == null ? null : row.amount * BigInt(row.quantity);
}

export class CartDto {
  // The currency the lines were priced in — the one the caller asked for
  currencyCode: string;
  items: CartItemDto[];
  // The sum of the lines that can actually be bought
  subtotal: CurrencyAmountDto;
  // Quantity summed across available lines, for a basket badge
  itemCount: number;

  static from(currencyCode: string, items: CartItemRow[]): CartDto {
    const dto = new CartDto();
    dto.currencyCode = currencyCode;
    dto.items = items.map((item) => CartItemDto.from(item));

    // Summed from the rows rather than from the DTOs, in minor units, for the reason on `lineMinor`.
    const total = items.reduce((sum, item) => (isAvailable(item) ? sum + (lineMinor(item) as bigint) : sum), 0n);
    dto.subtotal = CurrencyAmountDto.from(total, currencyCode);
    dto.itemCount = items.reduce((sum, item) => (isAvailable(item) ? sum + item.quantity : sum), 0);
    return dto;
  }
}

export class StaffCartItemDto extends CartItemDto {
  // Which basket this line sits in — a person may hold one at each outlet, so an edit must name it
  cartId: string;
  // The outlet whose basket it is. Null on a basket the company itself holds
  siteId: string | null;
  legalEntityId: string;

  static fromStaffRow(
    row: CartItemRow & { cartId: string; siteId: string | null; legalEntityId: string },
  ): StaffCartItemDto {
    const dto = Object.assign(new StaffCartItemDto(), CartItemDto.from(row));
    dto.cartId = row.cartId;
    dto.siteId = row.siteId;
    dto.legalEntityId = row.legalEntityId;
    return dto;
  }
}

export class CartDetailDto {
  id: string;
  siteId: string | null;
  legalEntityId: string | null;
  partyId: string;
  partyName: string;
  // Set while a payment is in flight, which is what freezes the basket
  checkoutStartedAt: string | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;

  static from(row: CartTableRow): CartDetailDto {
    const dto = new CartDetailDto();
    dto.id = row.id;
    dto.siteId = row.siteId;
    dto.legalEntityId = row.legalEntityId;
    dto.partyId = row.partyId;
    dto.partyName = row.partyName;
    dto.checkoutStartedAt = row.checkoutStartedAt?.toISOString() ?? null;
    dto.itemCount = Number(row.itemCount);
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}
