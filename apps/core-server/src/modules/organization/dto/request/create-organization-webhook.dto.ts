import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import type { OrgPlan, OrgSize } from '@/db/schema';
import { OrgPlanValues, OrgSizeValues } from '@/db/schema';

export class CreateOrganizationWebhookDto {
  @ApiProperty({ description: 'Organization name', example: 'Acme Corp' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Organization subdomain', example: 'acme-corp' })
  @IsString()
  @IsNotEmpty()
  subdomain: string;

  @ApiProperty({ description: 'Organization size', enum: ['0-10', '10-20', '20-50', '50-100', '100-500', '500+'], example: '0-10' })
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

  @ApiPropertyOptional({ description: 'Media asset ID for the organization logo', example: 42 })
  @IsOptional()
  @IsInt()
  mediaId?: number;
}
