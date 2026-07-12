import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, ValidateIf } from 'class-validator';
import { SiteTypeValues } from '@/db/schema';

export class UpdateSiteInternalDto {
  @ApiPropertyOptional({ example: 'Mysore Outlet' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ example: 'mysore' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    enum: ['OUTLET', 'WAREHOUSE', 'PRODUCTION'],
  })
  @IsOptional()
  @IsEnum(SiteTypeValues)
  type?: string;

  @ApiPropertyOptional({
    description: 'Site group ID; null detaches the site from its group',
    example: 'uuid-here',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((o) => o.groupId !== null)
  @IsUUID()
  groupId?: string | null;

  @ApiPropertyOptional({ description: 'Site description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Owning legal entity ID — can change but never clear', example: 'uuid-here' })
  @ValidateIf((_, value) => value !== undefined)
  @IsUUID()
  legalEntityId?: string;

  @ApiPropertyOptional({
    description: "Tax registration ID (must belong to the site's legal entity)",
    example: 'uuid-here',
  })
  @IsOptional()
  @IsUUID()
  registrationId?: string;

  @ApiPropertyOptional({ example: { city: 'Mysore' } })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
