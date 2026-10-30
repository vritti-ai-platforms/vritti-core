import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';
import { AddSupplierItemPriceDto } from './add-supplier-item-price.dto';

export class AddLeSupplierItemPriceDto extends AddSupplierItemPriceDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('7', { each: true })
  siteIds: string[];
}
