import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import { type WorkspaceScope, workspaceScopeOf } from '@/db/schema';
import type {
  SupplierQuotationItemRow,
  SupplierQuotationRow,
  SupplierQuotationSiteRow,
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
  legalEntityId: string | null;
  siteId: string | null;
  ownerScope: WorkspaceScope;
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
  // Whether the caller's workspace changes it: its owner, or the legal entity for its sites' quotations
  canWrite: boolean;
  createdAt: string;
  updatedAt: string;

  static from(row: SupplierQuotationTableRow): SupplierQuotationDto {
    const dto = new SupplierQuotationDto();
    dto.id = row.id;
    dto.supplierId = row.supplierId;
    dto.legalEntityId = row.legalEntityId;
    dto.siteId = row.siteId;
    dto.ownerScope = workspaceScopeOf(row);
    dto.quotationNumber = row.quotationNumber;
    dto.quotationDate = row.quotationDate;
    dto.currencyCode = row.currencyCode;
    dto.validFrom = row.validFrom;
    dto.validTo = row.validTo ?? null;
    dto.note = row.note ?? null;
    dto.itemCount = row.itemCount;
    dto.siteCount = row.siteCount;
    dto.canWrite = row.canWrite;
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
  uomSymbol: string;
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
    dto.uomSymbol = row.uomSymbol;
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
  siteId: string | null;
  postedBy: string | null;
  postedAt: string;
  // Whether the caller's workspace removes it: the site it is posted to, or the legal entity
  canRemove: boolean;

  static from(entity: SupplierQuotationSiteRow): SupplierQuotationSiteDto {
    const dto = new SupplierQuotationSiteDto();
    dto.id = entity.id;
    dto.siteId = entity.siteId;
    dto.canRemove = entity.canRemove;
    dto.postedBy = entity.postedBy ?? null;
    dto.postedAt = entity.createdAt.toISOString();
    return dto;
  }
}

export class SupplierQuotationDetailDto extends SupplierQuotationDto {
  items: SupplierQuotationItemDto[];
  sites: SupplierQuotationSiteDto[];

  static fromDetail(
    entity: SupplierQuotationRow,
    items: SupplierQuotationItemRow[],
    sites: SupplierQuotationSiteRow[],
  ): SupplierQuotationDetailDto {
    const dto = new SupplierQuotationDetailDto();
    Object.assign(dto, SupplierQuotationDto.from({ ...entity, itemCount: items.length, siteCount: sites.length }));
    dto.items = items.map(SupplierQuotationItemDto.from);
    dto.sites = sites.map(SupplierQuotationSiteDto.from);
    return dto;
  }
}
