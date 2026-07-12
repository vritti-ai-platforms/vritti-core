import { ApiProperty } from '@nestjs/swagger';
import type { FeatureLocks } from '@vritti/api-sdk/catalog-resolver';
import { Type } from 'class-transformer';
import { IsObject, IsOptional } from 'class-validator';

export class SetFeatureLocksInternalDto {
  @ApiProperty({
    description:
      'Per-feature lock deny-list (featureCode -> { web?, mobile? }; platform null locks the whole feature); null = inherit the full plan',
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  featureLocks?: FeatureLocks | null;
}
