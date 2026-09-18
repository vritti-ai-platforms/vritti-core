import { ApiProperty } from '@nestjs/swagger';

export class SmsProviderTemplateResponseDto {
  @ApiProperty({ description: 'Vritti row ID' })
  id: string;

  @ApiProperty({ description: 'SMS provider this template belongs to' })
  providerId: string;

  @ApiProperty({ description: "The vendor's own template ID, passed as template_id when sending" })
  templateId: string;

  @ApiProperty({ description: 'Display name given in Vritti' })
  name: string;

  @ApiProperty({
    description:
      'The vendor payload as returned, stored whole. MSG91 publishes no response schema for getVersions, so the shape is the vendor’s and is not reinterpreted here.',
    additionalProperties: true,
  })
  details: Record<string, unknown>;

  @ApiProperty({ description: 'ISO timestamp of the last read from the vendor' })
  syncedAt: string;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
