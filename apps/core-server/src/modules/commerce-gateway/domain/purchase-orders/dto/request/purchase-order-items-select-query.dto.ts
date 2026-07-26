import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/database';
import { IsOptional, IsUUID } from 'class-validator';

export class PurchaseOrderItemsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiProperty({ description: 'Purchase order whose lines populate the select.' })
  @IsUUID()
  purchaseOrderId: string;

  @ApiPropertyOptional({
    description: 'Exclude PO lines whose (inventoryItemId, uomId) is already on this goods receipt.',
  })
  @IsOptional()
  @IsUUID()
  excludeOnGoodsReceiptId?: string;
}
