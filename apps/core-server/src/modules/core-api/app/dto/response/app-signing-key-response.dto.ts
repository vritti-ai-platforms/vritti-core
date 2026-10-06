import { ApiProperty } from '@nestjs/swagger';

export class AppSigningKeyResponseDto {
  @ApiProperty({ description: 'Client id the key belongs to' })
  clientId: string;

  @ApiProperty({ description: 'Ed25519 private key, base64 pkcs8 DER — goes in the client’s environment' })
  signingKey: string;

  constructor(clientId: string, signingKey: string) {
    this.clientId = clientId;
    this.signingKey = signingKey;
  }
}
