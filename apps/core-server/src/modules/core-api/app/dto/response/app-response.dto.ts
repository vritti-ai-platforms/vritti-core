import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { App } from '@/db/schema';

/**
 * An app as cloud-web lists it.
 *
 * Carries the public key but **not** the private one. Listing a screenful of
 * private keys to render a table would put every credential in a response that
 * nobody asked for — the private half comes only from the explicit reveal route.
 */
export class AppResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() clientId: string;
  @ApiProperty() name: string;
  @ApiProperty() type: string;
  @ApiProperty() signingPublicKey: string;
  @ApiProperty() isActive: boolean;
  @ApiPropertyOptional({ nullable: true }) lastUsedAt: string | null;
  @ApiPropertyOptional({ nullable: true }) revokedAt: string | null;
  @ApiProperty() createdAt: string;

  constructor(app: App) {
    this.id = app.id;
    this.clientId = app.clientId;
    this.name = app.name;
    this.type = app.type;
    this.signingPublicKey = app.signingPublicKey;
    this.isActive = app.isActive;
    this.lastUsedAt = app.lastUsedAt?.toISOString() ?? null;
    this.revokedAt = app.revokedAt?.toISOString() ?? null;
    this.createdAt = app.createdAt.toISOString();
  }
}
