import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { SupplierItemPrice, SupplierPriceSource } from '@/db/schema';

export class SupplierItemPriceDto {
  id: string;
  supplierItemId: string;
  legalEntityId: string;
  siteId: string;
  unitPrice: CurrencyAmountDto;
  mrpId: string | null;
  mrp: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  taxInclusive: boolean;
  validFrom: string;
  validTo: string | null;
  source: SupplierPriceSource;
  quotationSiteId: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;

  // Maps a SupplierItemPrice entity to a SupplierItemPriceDto using the parent item's currency
  static from(entity: SupplierItemPrice & { mrpAmount?: bigint | null }): SupplierItemPriceDto {
    const dto = new SupplierItemPriceDto();
    dto.id = entity.id;
    dto.supplierItemId = entity.supplierItemId;
    dto.legalEntityId = entity.legalEntityId;
    dto.siteId = entity.siteId;
    dto.unitPrice = CurrencyAmountDto.from(entity.unitPrice, entity.currencyCode);
    dto.mrpId = entity.mrpId ?? null;
    dto.mrp = entity.mrpAmount != null ? CurrencyAmountDto.from(entity.mrpAmount, entity.currencyCode) : null;
    dto.schemeBuyQty = entity.schemeBuyQty ?? null;
    dto.schemeFreeQty = entity.schemeFreeQty ?? null;
    dto.taxInclusive = entity.taxInclusive;
    dto.validFrom = entity.validFrom;
    dto.validTo = entity.validTo ?? null;
    dto.source = entity.source;
    dto.quotationSiteId = entity.quotationSiteId ?? null;
    dto.note = entity.note ?? null;
    dto.createdBy = entity.createdBy ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}

// A price row of one supplier for an inventory item, with the supplier and the unit the price is per
export class ItemSupplierPriceDto extends SupplierItemPriceDto {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  uomSymbol: string | null;

  static fromItemRow(
    entity: SupplierItemPrice & {
      mrpAmount?: bigint | null;
      supplierId: string;
      supplierName: string;
      supplierCode: string;
      uomSymbol: string | null;
    },
  ): ItemSupplierPriceDto {
    const dto = Object.assign(new ItemSupplierPriceDto(), SupplierItemPriceDto.from(entity));
    dto.supplierId = entity.supplierId;
    dto.supplierName = entity.supplierName;
    dto.supplierCode = entity.supplierCode;
    dto.uomSymbol = entity.uomSymbol ?? null;
    return dto;
  }
}
