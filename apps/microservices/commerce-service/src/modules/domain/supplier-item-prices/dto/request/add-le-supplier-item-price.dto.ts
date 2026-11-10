import { IsArray, IsUUID } from 'class-validator';
import { AddSupplierItemPriceDto } from './add-supplier-item-price.dto';

export class AddLeSupplierItemPriceDto extends AddSupplierItemPriceDto {
  // Empty for the legal entity's price, which every site without one of its own uses
  @IsArray()
  @IsUUID('7', { each: true })
  siteIds: string[];
}
