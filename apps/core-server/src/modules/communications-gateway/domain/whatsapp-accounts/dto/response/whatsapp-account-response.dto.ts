import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WhatsappAccountResponseDto {
  @ApiProperty({ description: 'WhatsApp account ID' })
  id: string;

  @ApiPropertyOptional({ description: 'Legal entity that owns this WABA; null for an organization-wide account' })
  legalEntityId: string | null;

  @ApiProperty({ description: 'Meta Business Portfolio that owns the WABA' })
  metaBusinessId: string;

  @ApiProperty({ description: 'WhatsApp Business Account ID' })
  wabaId: string;

  @ApiProperty({ description: 'Human-readable name' })
  name: string;

  @ApiProperty({ description: 'Whether this account sends when nothing narrows the choice' })
  isDefault: boolean;

  @ApiProperty({ description: 'Whether the connection is usable' })
  isActive: boolean;

  @ApiProperty({ description: 'Whether Vritti is subscribed to this WABA’s Meta webhooks' })
  webhooksSubscribed: boolean;

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
