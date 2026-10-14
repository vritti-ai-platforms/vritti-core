import { IsNotEmpty, IsObject, IsString, MaxLength } from 'class-validator';

export class VerifyGatewayCredentialsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  gatewayCode: string;

  // Decrypted by core for this one call — the shape is owned by the transport, never stored here
  @IsObject()
  credentials: Record<string, string>;
}
