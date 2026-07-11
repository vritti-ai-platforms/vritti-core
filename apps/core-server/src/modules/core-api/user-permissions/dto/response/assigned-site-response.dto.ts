import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignedSiteResponseDto {
  @ApiProperty({ example: 'uuid-here' })
  id: string;

  @ApiProperty({ example: 'Mysore Outlet' })
  name: string;

  @ApiPropertyOptional({ example: 'mysore-01', nullable: true })
  code: string | null;

  @ApiProperty({ example: 'OUTLET' })
  type: string;

  @ApiProperty({ example: 'America/New_York' })
  timezone: string;

  @ApiProperty({ example: 'USD' })
  currencyCode: string;
  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  legalEntityId: string | null;
  @ApiPropertyOptional({ example: 'uuid-here', nullable: true })
  groupId: string | null;
}
