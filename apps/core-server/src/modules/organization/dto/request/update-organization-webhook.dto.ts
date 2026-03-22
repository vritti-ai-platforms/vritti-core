import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Allow, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OrgSizeValues } from '@/db/schema';

export class UpdateOrganizationWebhookDto {
  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ enum: ['0-10', '10-20', '20-50', '50-100', '100-500', '500+'] })
  @IsOptional()
  @IsEnum(OrgSizeValues)
  size?: string;

  @ApiPropertyOptional({ description: 'Public logo URL' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Feature catalog from app version snapshot' })
  @IsOptional()
  @Allow()
  @Transform(({ value }) => value, { toClassOnly: true })
  featureCatalog?: any;
}
