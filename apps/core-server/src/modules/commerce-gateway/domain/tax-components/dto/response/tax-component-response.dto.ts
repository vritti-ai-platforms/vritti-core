import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TaxComponentResponseDto {
  @ApiProperty({ description: 'Tax component ID' })
  id: string;

  @ApiProperty({ description: 'Uppercase ISO 3166-1 alpha-2 country whose tax the component is', example: 'IN' })
  countryCode: string;

  @ApiProperty({ description: 'Code, unique within the country', example: 'cgst' })
  code: string;

  @ApiProperty({ description: 'Human-readable name' })
  name: string;

  @ApiProperty({ description: 'Taxing authority level', enum: ['FEDERAL', 'STATE', 'COUNTY', 'CITY', 'SPECIAL'] })
  authorityLevel: string;

  @ApiPropertyOptional({ description: 'Component of the same country this one stands in for', nullable: true })
  standsInForId: string | null;

  @ApiPropertyOptional({ description: 'Name of the component this one stands in for', nullable: true, example: 'SGST' })
  standsInForName: string | null;

  @ApiProperty({ description: 'Whether the tax is recoverable (input credit)' })
  isRecoverable: boolean;

  @ApiProperty({ description: 'Whether the tax is a withholding tax' })
  isWithholding: boolean;

  @ApiProperty({ description: 'Whether the tax component is selectable' })
  isActive: boolean;

  @ApiProperty({ description: 'System-reserved (cannot be deleted)' })
  isSystem: boolean;

  @ApiProperty({ description: 'Whether hard-delete is allowed (not system, and no tax-group rate uses it)' })
  canDelete: boolean;

  @ApiProperty({ description: 'Whether it can be deactivated (no tax-group rate in force or still to come uses it)' })
  canDeactivate: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
