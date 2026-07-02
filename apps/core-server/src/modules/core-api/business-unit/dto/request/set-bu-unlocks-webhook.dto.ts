import { ApiProperty } from '@nestjs/swagger';
import type { BuFeatureUnlocks } from '@vritti/api-sdk/catalog-resolver';
import { Type } from 'class-transformer';
import { IsObject, IsOptional } from 'class-validator';

export class SetBuUnlocksWebhookDto {
  // Per-feature unlock overlay clamped to the plan in cloud; null clears the overlay (inherit full plan).
  // @Type(() => Object) pins the type so implicit conversion doesn't coerce nested arrays.
  @ApiProperty({
    description: 'Per-feature unlock overlay (featureCode -> { web?, mobile? }); null = inherit the full plan',
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  featureUnlocks?: BuFeatureUnlocks | null;
}
