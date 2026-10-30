import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { SupplierQuotationItemFieldsDto } from './supplier-quotation-item-fields.dto';

export class AddSupplierQuotationItemDto extends SupplierQuotationItemFieldsDto {
  @ApiProperty({ description: 'Inventory item quoted' })
  @IsUUID('7')
  inventoryItemId: string;

  @ApiProperty({ description: 'Unit the price is for; must be one the item can be bought in' })
  @IsUUID('7')
  uomId: string;
}
