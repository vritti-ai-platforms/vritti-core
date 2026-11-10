import { SupplierItemDetailDto } from '@domain/suppliers/dto/entity/supplier.dto';
import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { SupplierItem } from '@/db/schema';
import { SupplierSiteItemTermsDto, type SupplierSiteItemTermsRow } from './supplier-site-item-terms.dto';

export class SupplierSiteItemDetailDto extends SupplierItemDetailDto {
  supplierSiteItemId: string | null;
  isPreferred: boolean;
  leadTimeDays: number;
  isLeadTimeOverridden: boolean;
  unitPrice: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  taxInclusive: boolean;

  // Maps a supplier item's detail joined with one site's terms to a SupplierSiteItemDetailDto
  static fromSiteDetail(
    entity: SupplierItem &
      SupplierSiteItemTermsRow & {
        supplierCode: string | null;
        supplierCurrencyCode: string;
        supplierCurrencyCodes: string[];
        priceCount: number;
        pricedSiteCount: number;
      },
    itemName: string | null,
    uomSymbol: string | null,
  ): SupplierSiteItemDetailDto {
    const dto = new SupplierSiteItemDetailDto();
    Object.assign(dto, SupplierItemDetailDto.fromDetail(entity, itemName, uomSymbol));
    return SupplierSiteItemTermsDto.assign(dto, entity);
  }
}
