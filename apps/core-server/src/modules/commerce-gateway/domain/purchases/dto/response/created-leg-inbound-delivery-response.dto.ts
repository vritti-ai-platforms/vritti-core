import { ApiProperty } from '@nestjs/swagger';

export class CreatedLegInboundDeliveryResponseDto {
  @ApiProperty({ description: 'The inbound delivery created for the leg' })
  inboundDeliveryId: string;
}
