import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SiteSupplierItemPriceQueryDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsUUID('7')
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID('7')
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty({ description: 'UOM ID for pricing' })
  @IsUUID('7')
  @IsNotEmpty()
  uomId: string;
}
