import { ApiProperty } from '@nestjs/swagger';

export class WebhookDeliveryRefResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  deliveryId: string;
}
