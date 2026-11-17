import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class UpdateSitePurchasingSettingsDto {
  @IsUUID('7')
  siteId: string;

  // Buying an item from a supplier needs the supplier's item set up at the site
  @IsOptional()
  @IsBoolean()
  supplierItemsRequired?: boolean;

  // A sent purchase order sets up the supplier items it orders at the site, with the price it paid
  @IsOptional()
  @IsBoolean()
  updateSupplierItemsFromOrders?: boolean;
}
