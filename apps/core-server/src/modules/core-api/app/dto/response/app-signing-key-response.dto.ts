import { ApiProperty } from '@nestjs/swagger';

/**
 * The private key, returned only from the explicit reveal route.
 *
 * Kept a separate response type from `AppResponseDto` so the private half can
 * never be added to a list by accident — a field cannot leak into a shape it is
 * not part of.
 */
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
