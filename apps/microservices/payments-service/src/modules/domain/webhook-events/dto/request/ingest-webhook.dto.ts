import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class IngestWebhookDto {
  @IsUUID()
  organizationId: string;

  @IsUUID()
  configId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  gatewayCode: string;

  // Decrypted by core for this one call; null when the merchant has not configured one yet
  @IsOptional()
  @IsString()
  webhookSecret: string | null;

  // The exact bytes the gateway signed — any re-serialisation would break signature verification
  @IsString()
  @IsNotEmpty()
  rawBody: string;

  @IsObject()
  headers: Record<string, string>;
}
