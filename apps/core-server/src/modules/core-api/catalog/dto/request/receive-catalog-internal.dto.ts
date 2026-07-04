import { ApiProperty } from '@nestjs/swagger';
import type { CatalogLicense, SignedDocument } from '@vritti/api-sdk/license';
import { Type } from 'class-transformer';
import { IsObject, IsString } from 'class-validator';

export class ReceiveCatalogInternalDto implements SignedDocument<CatalogLicense> {
  // Signed as-is — validated cryptographically in CatalogService, not field-by-field here.
  // @Type(() => Object) pins the type so implicit conversion doesn't coerce nested arrays.
  @ApiProperty({
    description: 'Catalog license payload: deploymentId, version, hash, snapshot, issuedAt',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  @Type(() => Object)
  payload: CatalogLicense;

  @ApiProperty({ description: 'Base64 Ed25519 signature over the canonical payload JSON' })
  @IsString()
  signature: string;
}
