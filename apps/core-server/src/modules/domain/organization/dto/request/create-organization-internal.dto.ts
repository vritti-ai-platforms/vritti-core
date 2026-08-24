import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import type { OrgPlan, OrgSize, OrgStorage } from '@/db/schema';
import { OrgPlanValues, OrgSizeValues } from '@/db/schema';

export class CreateOrganizationInternalDto {
  @ApiProperty({ description: 'Organization name', example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Organization subdomain', example: 'acme-corp' })
  @IsString()
  @IsNotEmpty()
  subdomain: string;

  @ApiProperty({
    description: 'Organization size',
    enum: ['0-10', '10-20', '20-50', '50-100', '100-500', '500+'],
    example: '0-10',
  })
  @IsEnum(OrgSizeValues)
  size: OrgSize;

  @ApiPropertyOptional({ description: 'Subscription plan', enum: ['free', 'pro', 'enterprise'], example: 'free' })
  @IsOptional()
  @IsEnum(OrgPlanValues)
  plan?: OrgPlan;

  @ApiPropertyOptional({ description: 'Industry ID', example: 1 })
  @IsOptional()
  @IsInt()
  industryId?: number;

  @ApiPropertyOptional({ description: 'Public logo URL for light surfaces' })
  @IsOptional()
  @IsString()
  logoLightUrl?: string;

  @ApiPropertyOptional({ description: 'Public logo URL for dark surfaces' })
  @IsOptional()
  @IsString()
  logoDarkUrl?: string;

  @ApiProperty({ description: "The org's provisioned buckets and the credential scoped to them" })
  @IsObject()
  storage: OrgStorage;
}
