import { ApiProperty } from '@nestjs/swagger';
import type { OrgEntitlement, SignedDocument } from '@vritti/api-sdk/license';
import { Type } from 'class-transformer';
import { IsObject, IsString } from 'class-validator';

export class ReceiveEntitlementInternalDto implements SignedDocument<OrgEntitlement> {
  @ApiProperty({
    description: 'Entitlement payload: deploymentId, orgId, planCode, businessCode, issuedAt',
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  @Type(() => Object)
  payload: OrgEntitlement;

  @ApiProperty({ description: 'Base64 Ed25519 signature over the canonical payload JSON' })
  @IsString()
  signature: string;
}
