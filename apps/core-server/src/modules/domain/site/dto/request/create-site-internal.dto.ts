import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { SiteTypeValues } from '@/db/schema';

export class CreateSiteInternalDto {
  @ApiProperty({ description: 'Site name', example: 'Mysore Outlet' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Site code (unique per organization)', example: 'mysore' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    description: 'Site type',
    enum: ['OUTLET', 'WAREHOUSE', 'PRODUCTION'],
    example: 'OUTLET',
  })
  @IsEnum(SiteTypeValues)
  type: string;

  @ApiPropertyOptional({ description: 'Site group ID', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @ApiPropertyOptional({ description: 'Site description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Site timezone', example: 'Asia/Kolkata' })
  @IsString()
  @IsNotEmpty()
  timezone: string;

  @ApiProperty({ description: 'Owning legal entity ID — the site currency derives from it', example: 'uuid-here' })
  @IsUUID()
  legalEntityId: string;

  @ApiPropertyOptional({
    description: "Tax registration ID (must belong to the site's legal entity)",
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID()
  registrationId?: string;

  @ApiPropertyOptional({
    description: 'Site metadata (address, city, state, country, phone, etc.)',
    example: { city: 'Mysore' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Sort order in the org-structure graph (lower sorts first)', example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
