import { ApiPropertyOptional } from '@nestjs/swagger';
import type { FeatureUnlocks } from '@vritti/api-sdk/catalog-resolver';
import { IsBoolean, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateAppInternalDto {
  @ApiPropertyOptional({
    description: 'Nexus organization ID — scopes the lookup so one org cannot address another’s app',
  })
  @IsUUID()
  orgId: string;

  @ApiPropertyOptional({ description: 'New label' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ description: 'Suspend or restore the credential without revoking it' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'What the credential may do, keyed by bare feature code — e.g. {"people":{"app":["view","add"]}}. Replaces the whole set.',
  })
  @IsObject()
  @IsOptional()
  permissions?: FeatureUnlocks;
}
