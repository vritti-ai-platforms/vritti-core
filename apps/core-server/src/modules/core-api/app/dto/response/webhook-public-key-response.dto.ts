import { ApiProperty } from '@nestjs/swagger';

export class WebhookPublicKeyResponseDto {
  @ApiProperty({
    description: 'Ed25519 public key, base64 spki DER, that verifies x-vap-signature',
    example: 'MCowBQYDK2VwAyEA...',
  })
  publicKey: string;
}
