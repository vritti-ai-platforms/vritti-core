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

  // Builds one site's price history from its windows (ascending by validFrom) as of a calendar day
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

export class PriceHistoryLineDto {
  id: string;
  supplierId: string;
  label: string;
  current: PriceWindowDto | null;
  previous: PriceWindowDto | null;
  next: PriceWindowDto | null;
  windows: PriceWindowDto[];

  // Builds one chart line from its windows (ascending by validFrom) as of a calendar day
  static from(
    line: Pick<PriceHistoryLineDto, 'id' | 'supplierId' | 'label'>,
    windows: PriceWindowDto[],
    today: string,
  ): PriceHistoryLineDto {
    const dto = new PriceHistoryLineDto();
    Object.assign(dto, line);
    return Object.assign(dto, locatePrices(windows, today));
  }
}

export class InventoryItemPriceHistoryDto {
  currency: string | null;
  lines: PriceHistoryLineDto[];
}

// Each window carries its own currency; a supplier can requote an item in another of its currencies
export class SupplierItemPriceHistoryDto {
  currency: string | null;
  sites: SitePriceHistoryDto[];
}
