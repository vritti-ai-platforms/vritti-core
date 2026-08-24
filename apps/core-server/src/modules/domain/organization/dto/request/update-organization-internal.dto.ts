import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { type OrgCredential, OrgSizeValues } from '@/db/schema';

export class UpdateOrganizationInternalDto {
  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ enum: ['0-10', '10-20', '20-50', '50-100', '100-500', '500+'] })
  @IsOptional()
  @IsEnum(OrgSizeValues)
  size?: string;

  @ApiPropertyOptional({ description: 'Public logo URL for light surfaces' })
  @IsOptional()
  @IsString()
  logoLightUrl?: string;

  @ApiPropertyOptional({ description: 'Public logo URL for dark surfaces' })
  @IsOptional()
  @IsString()
  logoDarkUrl?: string;

  @ApiPropertyOptional({ description: 'False when the org has exceeded its plan storage allowance' })
  @IsOptional()
  @IsBoolean()
  storageEnabled?: boolean;

  @ApiPropertyOptional({ description: "Replacement credential pair, sent when the org's storage key is rotated" })
  @IsOptional()
  @IsObject()
  storageCredential?: OrgCredential;
}
