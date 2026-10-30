import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { SupplierQuotation, SupplierQuotationSite } from '@/db/schema';
import type {
  SupplierQuotationItemRow,
  SupplierQuotationTableRow,
} from '../../repositories/supplier-quotations.repository';

export const SupplierQuotationStatusValues = {
  DRAFT: 'DRAFT' as const,
  POSTED: 'POSTED' as const,
};
export type SupplierQuotationStatus =
  (typeof SupplierQuotationStatusValues)[keyof typeof SupplierQuotationStatusValues];

export class SupplierQuotationDto {
  id: string;
  supplierId: string;
  quotationNumber: string;
  quotationDate: string;
  currencyCode: string;
  validFrom: string;
  validTo: string | null;
  note: string | null;
  // Draft until posted to a site; the lines and validity are fixed from then on
  status: SupplierQuotationStatus;
  itemCount: number;
  siteCount: number;
  createdAt: string;
  updatedAt: string;

  static from(row: SupplierQuotationTableRow): SupplierQuotationDto {
    const dto = new SupplierQuotationDto();
    dto.id = row.id;
    dto.supplierId = row.supplierId;
    dto.quotationNumber = row.quotationNumber;
    dto.quotationDate = row.quotationDate;
    dto.currencyCode = row.currencyCode;
    dto.validFrom = row.validFrom;
    dto.validTo = row.validTo ?? null;
    dto.note = row.note ?? null;
    dto.itemCount = row.itemCount;
    dto.siteCount = row.siteCount;
    dto.status = row.siteCount > 0 ? SupplierQuotationStatusValues.POSTED : SupplierQuotationStatusValues.DRAFT;
    dto.createdAt = row.createdAt.toISOString();
    dto.updatedAt = row.updatedAt.toISOString();
    return dto;
  }
}

export class SupplierQuotationItemDto {
  id: string;
  inventoryItemId: string;
  uomId: string;
  inventoryItemName: string;
  supplierItemCode: string | null;
  uomSymbol: string | null;
  unitPrice: CurrencyAmountDto;
  mrpId: string | null;
  mrp: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  taxInclusive: boolean;

  static from(row: SupplierQuotationItemRow): SupplierQuotationItemDto {
    const dto = new SupplierQuotationItemDto();
    dto.id = row.id;
    dto.inventoryItemId = row.inventoryItemId;
    dto.uomId = row.uomId;
    dto.inventoryItemName = row.inventoryItemName;
    dto.supplierItemCode = row.supplierItemCode ?? null;
    dto.uomSymbol = row.uomSymbol ?? null;
    dto.unitPrice = CurrencyAmountDto.from(row.unitPrice, row.currencyCode);
    dto.mrpId = row.mrpId ?? null;
    dto.mrp = row.mrpAmount != null ? CurrencyAmountDto.from(row.mrpAmount, row.currencyCode) : null;
    dto.schemeBuyQty = row.schemeBuyQty ?? null;
    dto.schemeFreeQty = row.schemeFreeQty ?? null;
    dto.taxInclusive = row.taxInclusive;
    return dto;
  }
}

export class SupplierQuotationSiteDto {
  id: string;
  siteId: string;
  postedBy: string | null;
  postedAt: string;

  static from(entity: SupplierQuotationSite): SupplierQuotationSiteDto {
    const dto = new SupplierQuotationSiteDto();
    dto.id = entity.id;
    dto.siteId = entity.siteId;
    dto.postedBy = entity.postedBy ?? null;
    dto.postedAt = entity.createdAt.toISOString();
    return dto;
  }
}

export class SupplierQuotationDetailDto extends SupplierQuotationDto {
  items: SupplierQuotationItemDto[];
  sites: SupplierQuotationSiteDto[];

  static fromDetail(
    entity: SupplierQuotation,
    items: SupplierQuotationItemRow[],
    sites: SupplierQuotationSite[],
  ): SupplierQuotationDetailDto {
    const dto = new SupplierQuotationDetailDto();
    Object.assign(dto, SupplierQuotationDto.from({ ...entity, itemCount: items.length, siteCount: sites.length }));
    dto.items = items.map(SupplierQuotationItemDto.from);
    dto.sites = sites.map(SupplierQuotationSiteDto.from);
    return dto;
  }
}
