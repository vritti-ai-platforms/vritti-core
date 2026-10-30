import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { SupplierItemPrice } from '@/db/schema';

export class PriceWindowDto {
  id: string;
  unitPrice: CurrencyAmountDto;
  validFrom: string;
  validTo: string | null;

  // `unitPrice` overrides the row's amount, for a price converted to another unit; the currency is always the row's
  static from(entity: SupplierItemPrice, unitPrice: bigint = entity.unitPrice): PriceWindowDto {
    const dto = new PriceWindowDto();
    dto.id = entity.id;
    dto.unitPrice = CurrencyAmountDto.from(unitPrice, entity.currencyCode);
    dto.validFrom = entity.validFrom;
    dto.validTo = entity.validTo ?? null;
    return dto;
  }
}

export class SitePriceHistoryDto {
  siteId: string;
  current: PriceWindowDto | null;
  previous: PriceWindowDto | null;
  next: PriceWindowDto | null;
  windows: PriceWindowDto[];

  // Builds one site's history from its windows (ascending by validFrom) as of a calendar day
  static from(siteId: string, windows: PriceWindowDto[], today: string): SitePriceHistoryDto {
    const dto = new SitePriceHistoryDto();
    dto.siteId = siteId;
    return Object.assign(dto, locatePrices(windows, today));
  }
}

// A price timeline's windows (ascending by validFrom) with the price in force on a day, the one before it, and the
// next scheduled change
function locatePrices(
  windows: PriceWindowDto[],
  today: string,
): {
  windows: PriceWindowDto[];
  current: PriceWindowDto | null;
  previous: PriceWindowDto | null;
  next: PriceWindowDto | null;
} {
  const currentIndex = windows.findIndex(
    (window) => window.validFrom <= today && (!window.validTo || window.validTo >= today),
  );
  return {
    windows,
    current: currentIndex >= 0 ? windows[currentIndex] : null,
    previous: currentIndex > 0 ? windows[currentIndex - 1] : null,
    next: windows.find((window) => window.validFrom > today) ?? null,
  };
}

// One supplier's prices for an inventory item at a site, per the item's primary unit so suppliers quoting different
// units line up
export class ItemSupplierPriceHistoryDto {
  supplierId: string;
  supplierItemId: string;
  supplierName: string;
  supplierCode: string;
  // The unit the supplier quotes in; the windows are converted from it, each staying in its own currency
  quotedUomSymbol: string | null;
  current: PriceWindowDto | null;
  previous: PriceWindowDto | null;
  next: PriceWindowDto | null;
  windows: PriceWindowDto[];

  static from(
    supplier: Pick<
      ItemSupplierPriceHistoryDto,
      'supplierId' | 'supplierItemId' | 'supplierName' | 'supplierCode' | 'quotedUomSymbol'
    >,
    windows: PriceWindowDto[],
    today: string,
  ): ItemSupplierPriceHistoryDto {
    const dto = new ItemSupplierPriceHistoryDto();
    Object.assign(dto, supplier);
    return Object.assign(dto, locatePrices(windows, today));
  }
}

export class InventoryItemPriceHistoryDto {
  siteId: string;
  // Every supplier's prices are per this unit
  uomSymbol: string | null;
  // The suppliers drawn — the ones asked for, or by default the preferred and most recently priced — at most
  // MAX_CHARTED_SUPPLIERS of them
  suppliers: ItemSupplierPriceHistoryDto[];
  // Every supplier with a price for the item at the site within the window
  supplierCount: number;
}

// Each window carries its own currency; a supplier can requote an item in another of its currencies
export class SupplierItemPriceHistoryDto {
  sites: SitePriceHistoryDto[];
}
