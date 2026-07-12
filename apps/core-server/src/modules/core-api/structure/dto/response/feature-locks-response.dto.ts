import { ApiProperty } from '@nestjs/swagger';
import type { FeatureLocks } from '@vritti/api-sdk/catalog-resolver';

export class FeatureLocksResponseDto {
  @ApiProperty({
    description: 'The stored feature lock deny-list (featureCode -> { web?, mobile? }); null = inherit the full plan',
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  featureLocks: FeatureLocks | null;
}
