import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaxRateResponseDto {
  @ApiProperty({ description: 'Tax rate ID' })
  id: string;

  @ApiProperty({ description: 'Tax rate name', example: 'CGST' })
  name: string;

  @ApiProperty({ description: 'Tax rate percentage', example: 9 })
  rate: number;

  @ApiProperty({ description: 'Rate type', enum: ['inclusive', 'exclusive'] })
  type: string;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;
}

export class TaxGroupResponseDto {
  @ApiProperty({ description: 'Tax group ID' })
  id: string;

  @ApiProperty({ description: 'Tax group name' })
  name: string;

  @ApiProperty({ description: 'Whether this is the default tax group' })
  isDefault: boolean;

  @ApiProperty({ description: 'Whether the tax group is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Display sort order' })
  sortOrder: number;

  @ApiProperty({ description: 'Tax rates in this group', type: [TaxRateResponseDto] })
  taxRates: TaxRateResponseDto[];
}
