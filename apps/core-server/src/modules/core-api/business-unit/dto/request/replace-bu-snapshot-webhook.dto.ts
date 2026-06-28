import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray } from 'class-validator';
import type { FeatureCatalogEntry } from '@/db/schema';

export class ReplaceBuSnapshotWebhookDto {
  // Full per-BU feature catalog (snapshot) pushed from cloud — replaces the stored catalog. Apps are derived from it.
  // @Type(() => Object) pins the element type so implicit conversion stops coercing each entry to [].
  @ApiProperty({
    description: 'Resolved feature catalog (snapshot) for this business unit',
    type: 'array',
    items: { type: 'object' },
  })
  @IsArray()
  @Type(() => Object)
  featureCatalog: FeatureCatalogEntry[];
}
