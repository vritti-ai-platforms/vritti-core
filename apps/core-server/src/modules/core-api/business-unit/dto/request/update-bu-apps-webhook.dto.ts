import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';
import type { FeatureCatalogEntry } from '@/db/schema';

export class UpdateBuAppsWebhookDto {
  @ApiProperty({ description: 'App codes to assign to this business unit', example: ['inventory', 'pos'] })
  @IsArray()
  @IsString({ each: true })
  appCodes: string[];

  // Derived per-BU feature catalog pushed from cloud — overwrites the stored catalog.
  // @Type(() => Object) pins the element type so implicit conversion stops coercing each entry to [].
  @ApiProperty({ description: 'Resolved feature catalog for this business unit', type: 'array', items: { type: 'object' } })
  @IsArray()
  @Type(() => Object)
  featureCatalog: FeatureCatalogEntry[];
}
