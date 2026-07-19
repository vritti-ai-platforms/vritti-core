import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { SupplierItemPrice, SupplierPriceSource } from '@/db/schema';

export class SupplierItemPriceDto {
  id: string;
  supplierItemId: string;
  siteId: string | null;
  unitPrice: CurrencyAmountDto;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  validFrom: string;
  validTo: string | null;
  source: SupplierPriceSource;
  createdAt: string;

  // Maps a SupplierItemPrice entity to a SupplierItemPriceDto using the parent item's currency
  static from(entity: SupplierItemPrice, currencyCode: string): SupplierItemPriceDto {
    const dto = new SupplierItemPriceDto();
    dto.id = entity.id;
    dto.supplierItemId = entity.supplierItemId;
    dto.siteId = entity.siteId ?? null;
    dto.unitPrice = CurrencyAmountDto.from(entity.unitPrice, currencyCode);
    dto.schemeBuyQty = entity.schemeBuyQty ?? null;
    dto.schemeFreeQty = entity.schemeFreeQty ?? null;
    dto.validFrom = entity.validFrom;
    dto.validTo = entity.validTo ?? null;
    dto.source = entity.source;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
