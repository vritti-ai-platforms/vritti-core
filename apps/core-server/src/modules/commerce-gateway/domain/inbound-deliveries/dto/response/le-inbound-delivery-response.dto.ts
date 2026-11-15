import { ApiProperty } from '@nestjs/swagger';
import { InboundDeliveryResponseDto } from './inbound-delivery-response.dto';

export class LeInboundDeliveryResponseDto extends InboundDeliveryResponseDto {
  @ApiProperty({ description: 'Site name (gateway-enriched, not sortable)' })
  siteName: string;

  @ApiProperty({ description: 'Site code (gateway-enriched, not sortable)' })
  siteCode: string;
}
