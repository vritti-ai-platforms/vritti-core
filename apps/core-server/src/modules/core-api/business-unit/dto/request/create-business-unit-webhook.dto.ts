import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { BuTypeValues } from '@/db/schema';

export class CreateBusinessUnitWebhookDto {
  @ApiProperty({ description: 'Organization ID', example: 'uuid-here' })
  @IsUUID()
  orgId: string;

  @ApiPropertyOptional({ description: 'Parent business unit ID', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ description: 'Business unit name', example: 'US East Region' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Business unit code', example: 'US-EAST' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'Business unit type',
    enum: ['ORGANIZATION', 'REGION', 'FRANCHISEE', 'BRANCH', 'TEAM', 'DEPARTMENT', 'CUSTOM'],
    example: 'REGION',
  })
  @IsEnum(BuTypeValues)
  type: string;

  @ApiPropertyOptional({ description: 'Business unit description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Business unit metadata (address, timezone, etc.)', example: { city: 'New York' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
