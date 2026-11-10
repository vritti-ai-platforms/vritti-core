import { ApiProperty } from '@nestjs/swagger';
import { SelectOptionsQueryDto } from '@vritti/api-sdk/select';
import { IsUUID } from 'class-validator';

export class DeliverablePurchaseOrderItemsSelectQueryDto extends SelectOptionsQueryDto {
  @ApiProperty({ description: "Inbound delivery being filled: its supplier's open lines at its site, not yet on it" })
  @IsUUID('7')
  inboundDeliveryId: string;
}
