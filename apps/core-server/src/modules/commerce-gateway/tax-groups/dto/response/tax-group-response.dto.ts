import { ApiProperty } from '@nestjs/swagger';

export class TaxRateResponseDto {
  @ApiProperty({ description: 'Tax rate ID' })
  id: string;

  @ApiProperty({ description: 'Tax rate name', example: 'CGST' })
  name: string;

  @ApiProperty({ description: 'Tax rate percentage', example: 9 })
  rate: number;

  @ApiProperty({ description: 'Sort order' })
  sortOrder: number;
}

export class TaxGroupResponseDto {
  @ApiProperty({ description: 'Tax group ID' })
  id: string;

  @ApiProperty({ description: 'Tax group name' })
  name: string;

  @ApiProperty({ description: 'Whether the tax group is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Whether this tax group can be deleted (not referenced by items or offerings)' })
  canDelete: boolean;

  @ApiProperty({ description: 'Tax rates in this group', type: [TaxRateResponseDto] })
  taxRates: TaxRateResponseDto[];
}
