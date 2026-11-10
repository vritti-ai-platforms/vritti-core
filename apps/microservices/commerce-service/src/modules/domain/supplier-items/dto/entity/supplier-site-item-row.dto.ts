import { SupplierItemDto } from '@domain/suppliers/dto/entity/supplier.dto';
import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type { SupplierItem } from '@/db/schema';
import { SupplierSiteItemTermsDto, type SupplierSiteItemTermsRow } from './supplier-site-item-terms.dto';

export class SupplierSiteItemRowDto extends SupplierItemDto {
  supplierSiteItemId: string | null;
  isPreferred: boolean;
  leadTimeDays: number;
  isLeadTimeOverridden: boolean;
  unitPrice: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  taxInclusive: boolean;

  // Maps a supplier item joined with one site's terms to a SupplierSiteItemRowDto
  static fromSite(
    entity: SupplierItem & SupplierSiteItemTermsRow,
    itemName?: string | null,
    uomSymbol?: string | null,
  ): SupplierSiteItemRowDto {
    const dto = new SupplierSiteItemRowDto();
    Object.assign(dto, SupplierItemDto.from(entity, itemName, uomSymbol));
    return SupplierSiteItemTermsDto.assign(dto, entity);
  }
}
