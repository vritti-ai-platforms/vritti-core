import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk';
import { IsOptional, IsUUID } from 'class-validator';

export class SupplierItemsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiPropertyOptional({ description: 'Filter to a specific supplier' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({
    description: 'Restrict results to supplier items whose (inventoryItemId, uomId) matches a line on this purchase order.',
  })
  @IsOptional()
  @IsUUID()
  purchaseOrderId?: string;

  @ApiPropertyOptional({
    description: 'Exclude supplier items whose (inventoryItemId, uomId) is already on this purchase order.',
  })
  @IsOptional()
  @IsUUID()
  excludeOnPurchaseOrderId?: string;

  @ApiPropertyOptional({
    description: 'Exclude supplier items whose (inventoryItemId, uomId) is already on this goods receipt.',
  })
  @IsOptional()
  @IsUUID()
  excludeOnGoodsReceiptId?: string;
}
