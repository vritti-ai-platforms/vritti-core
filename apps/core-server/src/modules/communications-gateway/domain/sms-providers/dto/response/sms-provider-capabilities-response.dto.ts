import { ApiProperty } from '@nestjs/swagger';

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
