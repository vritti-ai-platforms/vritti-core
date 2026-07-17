import { ApiProperty } from '@nestjs/swagger';

export class TaxClassResponseDto {
  @ApiProperty({ description: 'Tax class ID' })
  id: string;

  @ApiProperty({ description: 'Unique code within the org', example: 'gst-standard' })
  code: string;

  @ApiProperty({ description: 'Human-readable name' })
  name: string;

  @ApiProperty({ description: 'Whether the tax class is selectable' })
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
