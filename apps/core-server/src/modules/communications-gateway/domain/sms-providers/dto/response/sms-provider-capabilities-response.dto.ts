import { ApiProperty } from '@nestjs/swagger';

/**
 * What a provider implementation supports.
 *
 * Served from the registry rather than a constant, so the set of connectable providers is always
 * exactly the set with a transport behind it. A static enum duplicated across layers drifts —
 * which is how TWILIO ended up offered in the connect dropdown with nothing able to send through it.
 */
export class SmsProviderCapabilitiesResponseDto {
  @ApiProperty({ description: 'Registry code of the provider implementation', example: 'MSG91' })
  code: string;

  @ApiProperty({ description: 'Whether a send is addressed by a vendor template (DLT, for MSG91)' })
  requiresTemplate: boolean;

  @ApiProperty({ description: 'Whether connecting it needs credentials at all' })
  requiresCredentials: boolean;

  @ApiProperty({ description: 'Whether templates can be listed and registered against it' })
  supportsTemplates: boolean;
}
