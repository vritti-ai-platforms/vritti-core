import { ApiProperty } from '@nestjs/swagger';

export class SalesChannelResponseDto {
  @ApiProperty({ description: 'Sales channel ID' })
  id: string;

  @ApiProperty({ description: 'Unique code within the org', example: 'IN_STORE' })
  code: string;

  @ApiProperty({ description: 'Human-readable name' })
  name: string;

  @ApiProperty({ description: 'Canonical channel kind', enum: ['IN_STORE', 'ONLINE', 'ZOMATO', 'SWIGGY', 'OTHER'] })
  kind: string;

  @ApiProperty({ description: 'Whether the channel is selectable' })
  isActive: boolean;

  @ApiProperty({ description: 'System-reserved (cannot be deleted)' })
  isSystem: boolean;

  @ApiProperty({ description: 'Whether hard-delete is allowed (no catalogs/terminals reference it + not system)' })
  canDelete: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
