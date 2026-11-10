import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCurrencyCode } from '@vritti/api-sdk/money';
import { IsEnum, IsInt, IsISO31661Alpha2, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
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

  @ApiProperty({ description: 'ISO 4217 currency of org and site-group workspaces', example: 'INR' })
  @IsCurrencyCode()
  defaultCurrencyCode: string;

  @ApiProperty({ description: 'ISO 3166-1 alpha-2 country of the organization', example: 'IN' })
  @IsISO31661Alpha2()
  countryCode: string;

  @ApiPropertyOptional({
    description: 'Subscription plan',
    enum: Object.values(OrgPlanValues),
    example: OrgPlanValues.FREE,
  })
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
