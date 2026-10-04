import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsOptional, IsUUID } from 'class-validator';

export class PurchaseOrderItemsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiProperty({ description: 'Purchase order whose lines populate the select.' })
  @IsUUID('7')
  purchaseOrderId: string;

  @ApiPropertyOptional({
    description: 'Exclude PO lines whose (inventoryItemId, uomId) is already on this goods receipt.',
  })
  @IsOptional()
  @IsUUID('7')
  excludeOnGoodsReceiptId?: string;
}
