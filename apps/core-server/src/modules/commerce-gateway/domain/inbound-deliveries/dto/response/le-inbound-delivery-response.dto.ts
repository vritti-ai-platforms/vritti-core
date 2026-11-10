import { ApiPropertyOptional } from '@nestjs/swagger';
import { InboundDeliveryResponseDto } from './inbound-delivery-response.dto';

export class LeInboundDeliveryResponseDto extends InboundDeliveryResponseDto {
  @ApiPropertyOptional({ description: 'Site name (gateway-enriched, not sortable)', nullable: true })
  siteName: string | null;

  @ApiPropertyOptional({ description: 'Site code (gateway-enriched, not sortable)', nullable: true })
  siteCode: string | null;
}
