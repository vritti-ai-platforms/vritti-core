import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk';
import { IsOptional, IsUUID } from 'class-validator';

export class InventoryItemsSupplierSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Filter to a specific supplier' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Exclude items already on this purchase order' })
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;
}
