import {
  PARTY_COMMUNICATION_CHANNELS,
  type PartyCommunicationChannelValue,
} from '@commerce/party-communications/dto/request/party-communication-app.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Resolving who is reachable at a presented email or phone.
 *
 * Arrives as query parameters, which are covered by the request signature — the
 * canonical carries the raw query string, so a filter altered in transit invalidates
 * it. That is what made the HTTP app type safe for a GET with parameters.
 */
export class FindPeopleByCommunicationQueryDto {
  @ApiProperty({ description: 'Channel to search', enum: PARTY_COMMUNICATION_CHANNELS })
  @IsIn(Object.values(PARTY_COMMUNICATION_CHANNELS))
  channel: PartyCommunicationChannelValue;

  @ApiProperty({ description: 'The value to resolve', example: 'ramesh@example.com' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value: string;
}
