import { ApiProperty } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsUUID } from 'class-validator';

export class PurchaseOrderItemsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiProperty({ description: 'Purchase order whose lines populate the select.' })
  @IsUUID('7')
  purchaseOrderId: string;
}
