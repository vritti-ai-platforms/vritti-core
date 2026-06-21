import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import type { FeatureCatalogEntry } from '@/db/schema';

export class UpdateBuAppsWebhookDto {
  @ApiProperty({ description: 'App codes to assign to this business unit', example: ['inventory', 'pos'] })
  @IsArray()
  @IsString({ each: true })
  appCodes: string[];

  // Derived per-BU feature catalog pushed from cloud — overwrites the stored catalog
  @ApiProperty({ description: 'Resolved feature catalog for this business unit', type: 'array', items: { type: 'object' } })
  @IsArray()
  featureCatalog: FeatureCatalogEntry[];
}
