import { ApiProperty } from '@nestjs/swagger';
import { WebhookDeliveryDto } from '../entity/webhook-delivery.dto';

export class WebhookDeliveriesPageResponseDto {
  @ApiProperty({ type: [WebhookDeliveryDto] })
  result: WebhookDeliveryDto[];

  @ApiProperty({ example: 42 })
  count: number;
}
