import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrgStructureSelectOptionDto {
  @ApiProperty({ example: 'uuid-here' })
  value: string;

  @ApiProperty({ example: 'Acme Retail Pvt Ltd' })
  label: string;

  @ApiPropertyOptional({ example: 'ACME-RETAIL' })
  description?: string;
}

export class OrgStructureSelectResponseDto {
  @ApiProperty({ type: [OrgStructureSelectOptionDto] })
  options: OrgStructureSelectOptionDto[];

  @ApiProperty({ example: false })
  hasMore: boolean;

  @ApiPropertyOptional({ example: 12 })
  totalCount?: number;
}
