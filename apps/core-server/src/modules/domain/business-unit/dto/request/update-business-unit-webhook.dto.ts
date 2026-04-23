import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { BuTypeValues } from '@/db/schema';

export class UpdateBusinessUnitWebhookDto {
  @ApiPropertyOptional({ example: 'US East Region' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 'US-EAST' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    enum: ['ORGANIZATION', 'REGION', 'FRANCHISEE', 'BRANCH', 'TEAM', 'DEPARTMENT', 'CUSTOM'],
  })
  @IsOptional()
  @IsEnum(BuTypeValues)
  type?: string;

  @ApiPropertyOptional({ description: 'Business unit description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  timezone?: string;

  @ApiPropertyOptional({ example: { city: 'New York' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
