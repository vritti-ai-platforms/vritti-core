import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SiteSupplierItemPriceQueryDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsUUID()
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @ApiProperty({ description: 'UOM ID for pricing' })
  @IsUUID()
  @IsNotEmpty()
  uomId: string;
}
