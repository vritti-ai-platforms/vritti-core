import { ApiProperty } from '@nestjs/swagger';
import type { BuFeatureLocks } from '@vritti/api-sdk/catalog-resolver';
import { Type } from 'class-transformer';
import { IsObject, IsOptional } from 'class-validator';

export class SetBuLocksInternalDto {
  // Per-feature lock deny-list within the plan (out-of-plan locks are inert); null clears the overlay.
  // @Type(() => Object) pins the type so implicit conversion doesn't coerce nested arrays.
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
  featureLocks?: BuFeatureLocks | null;
}
