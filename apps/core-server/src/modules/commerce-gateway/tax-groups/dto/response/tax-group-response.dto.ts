import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaxGroupResponseDto {
  @ApiProperty({ description: 'Tax group ID' })
  id: string;

  @ApiProperty({ description: 'Tax group name' })
  name: string;

  @ApiProperty({ description: 'Combined tax rate', example: 18 })
  rate: number;

  @ApiPropertyOptional({ description: 'HSN/SAC code', example: '99631100' })
  hsnSacCode: string | null;

  @ApiProperty({ description: 'CGST rate', example: 9 })
  cgstRate: number;

  @ApiProperty({ description: 'SGST rate', example: 9 })
  sgstRate: number;

  @ApiProperty({ description: 'IGST rate', example: 0 })
  igstRate: number;

  @ApiProperty({ description: 'Cess rate', example: 0 })
  cessRate: number;

  @ApiProperty({ description: 'Whether this is the default tax group' })
  isDefault: boolean;

  @ApiProperty({ description: 'Whether the tax group is active' })
  isActive: boolean;

  @ApiProperty({ description: 'Display sort order' })
  sortOrder: number;
}
