import type { SitePurchasingSettings } from '@/db/schema';

export class SitePurchasingSettingsDto {
  siteId: string;
  supplierItemsRequired: boolean;
  updateSupplierItemsFromOrders: boolean;

  // Shapes a site's purchasing rules
  static from(entity: SitePurchasingSettings): SitePurchasingSettingsDto {
    const dto = new SitePurchasingSettingsDto();
    dto.siteId = entity.siteId;
    dto.supplierItemsRequired = entity.supplierItemsRequired;
    dto.updateSupplierItemsFromOrders = entity.updateSupplierItemsFromOrders;
    return dto;
  }

  // The rules of a site the legal entity has not set any for: any enrolled supplier, nothing recorded from its orders
  static defaults(siteId: string): SitePurchasingSettingsDto {
    const dto = new SitePurchasingSettingsDto();
    dto.siteId = siteId;
    dto.supplierItemsRequired = false;
    dto.updateSupplierItemsFromOrders = false;
    return dto;
  }
}
