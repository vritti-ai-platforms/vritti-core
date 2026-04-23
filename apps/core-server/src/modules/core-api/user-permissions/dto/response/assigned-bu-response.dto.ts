import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignedBuResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'US East Region' })
  name: string;

  @ApiPropertyOptional({ example: 'US-EAST', nullable: true })
  code: string | null;

  @ApiProperty({ example: 'REGION' })
  type: string;

  @ApiProperty({ example: 'America/New_York' })
  timezone: string;
}
