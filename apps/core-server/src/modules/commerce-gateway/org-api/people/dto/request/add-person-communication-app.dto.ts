import {
  PARTY_COMMUNICATION_CHANNELS,
  type PartyCommunicationChannelValue,
} from '@commerce/party-communications/dto/request/party-communication-app.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Adding a communication to an existing person, app-facing.
 *
 * `isPrimary` is deliberately absent. An app adds a `WEB_APP` reference, which a
 * CHECK on the table forbids from being primary anyway, and re-pointing someone's
 * primary email is a staff decision rather than something a signup should do.
 *
 * The person comes from the route, not the body.
 */
export class AddPersonCommunicationAppDto {
  @ApiProperty({ description: 'Communication channel', enum: PARTY_COMMUNICATION_CHANNELS })
  @IsIn(Object.values(PARTY_COMMUNICATION_CHANNELS))
  channel: PartyCommunicationChannelValue;

  @ApiProperty({ description: 'The address, number, or external reference', example: 'ramesh@example.com' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value: string;
}
