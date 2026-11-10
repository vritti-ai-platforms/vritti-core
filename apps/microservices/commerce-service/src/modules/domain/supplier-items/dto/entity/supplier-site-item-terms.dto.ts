import { CurrencyAmountDto } from '@vritti/api-sdk/money';

export type SupplierSiteItemTermsRow = {
  supplierSiteItemId: string | null;
  siteIsPreferred: boolean | null;
  siteLeadTimeDays: number | null;
  siteIsLeadTimeOverridden: boolean | null;
  currentUnitPrice: bigint | null;
  currentCurrencyCode: string | null;
  currentSchemeBuyQty: number | null;
  currentSchemeFreeQty: number | null;
  currentTaxInclusive: boolean | null;
};

// One site's terms for a supplier item — its operational settings and the price in force today
export class SupplierSiteItemTermsDto {
  supplierSiteItemId: string | null;
  isPreferred: boolean;
  leadTimeDays: number;
  isLeadTimeOverridden: boolean;
  minOrderQuantity: number | null;
  unitPrice: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  taxInclusive: boolean;

  // The minimum order is the supplier item's own; a site not carrying the item shows the item's default lead time
  static assign<T extends SupplierSiteItemTermsDto>(
    dto: T,
    row: SupplierSiteItemTermsRow & { minOrderQuantity: number | null; defaultLeadTimeDays: number },
  ): T {
    dto.supplierSiteItemId = row.supplierSiteItemId ?? null;
    dto.isPreferred = row.siteIsPreferred ?? false;
    dto.leadTimeDays = row.siteLeadTimeDays ?? row.defaultLeadTimeDays;
    dto.isLeadTimeOverridden = row.siteIsLeadTimeOverridden ?? false;
    dto.minOrderQuantity = row.minOrderQuantity ?? null;
    dto.unitPrice = row.currentCurrencyCode
      ? CurrencyAmountDto.from(row.currentUnitPrice, row.currentCurrencyCode)
      : null;
    dto.schemeBuyQty = row.currentSchemeBuyQty ?? null;
    dto.schemeFreeQty = row.currentSchemeFreeQty ?? null;
    dto.hasScheme = dto.schemeBuyQty != null && dto.schemeFreeQty != null;
    dto.taxInclusive = row.currentTaxInclusive ?? false;
    return dto;
  }
}
