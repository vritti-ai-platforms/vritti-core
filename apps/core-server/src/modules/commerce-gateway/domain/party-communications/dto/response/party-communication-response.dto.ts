import { ApiProperty } from '@nestjs/swagger';
import {
  PARTY_COMMUNICATION_CHANNELS,
  PartyCommunicationAppDto,
  type PartyCommunicationChannelValue,
} from '../request/party-communication-app.dto';

export class PartyCommunicationResponseDto {
  @ApiProperty({ description: 'Communication ID' })
  id: string;

  @ApiProperty({ description: 'The party ID' })
  partyId: string;

  @ApiProperty({ description: 'Communication channel', enum: PARTY_COMMUNICATION_CHANNELS })
  channel: PartyCommunicationChannelValue;

  @ApiProperty({ description: 'The email address or phone number', example: 'priya@acme.in' })
  value: string;

  @ApiProperty({ description: 'Whether this is the primary value for its channel' })
  isPrimary: boolean;

  @ApiProperty({ description: 'Whether the communication is active' })
  isActive: boolean;

  @ApiProperty({ type: [PartyCommunicationAppDto], description: 'Messaging apps reachable on this number' })
  apps: PartyCommunicationAppDto[];

  @ApiProperty({ description: 'ISO timestamp of creation' })
  createdAt: string;

  @ApiProperty({ description: 'ISO timestamp of last update' })
  updatedAt: string;
}
