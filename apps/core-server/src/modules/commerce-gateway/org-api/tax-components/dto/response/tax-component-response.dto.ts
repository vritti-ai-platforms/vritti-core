import { ApiProperty } from '@nestjs/swagger';

export class TaxComponentResponseDto {
  @ApiProperty({ description: 'Tax component ID' })
  id: string;

  @ApiProperty({ description: 'Unique code within the org', example: 'gst-standard' })
  code: string;

  @ApiProperty({ description: 'Human-readable name' })
  name: string;

  @ApiProperty({ description: 'Taxing authority level', enum: ['FEDERAL', 'STATE', 'COUNTY', 'CITY', 'SPECIAL'] })
  authorityLevel: string;

  @ApiProperty({ description: 'Whether the tax is recoverable (input credit)' })
  isRecoverable: boolean;

  @ApiProperty({ description: 'Whether the tax is a withholding tax' })
  isWithholding: boolean;

  @ApiProperty({ description: 'Whether the tax component is selectable' })
  isActive: boolean;

  @ApiProperty({ description: 'System-reserved (cannot be deleted)' })
  isSystem: boolean;

  @ApiProperty({ description: 'Whether hard-delete is allowed (not system)' })
  canDelete: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
