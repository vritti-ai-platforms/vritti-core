import { IsNotEmpty, IsObject, IsString, MaxLength } from 'class-validator';
import type { LinkedAccountProviderData } from '../../gateway-transport';

export class FetchLinkedAccountStatusDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  gatewayCode: string;

  // Decrypted by core for this one call — the shape is owned by the transport, never stored here
  @IsObject()
  credentials: Record<string, string>;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  providerAccountId: string;

  // The opaque references the transport returned at creation, sent back unchanged
  @IsObject()
  providerData: LinkedAccountProviderData;
}
