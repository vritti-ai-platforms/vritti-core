import {
  PARTY_COMMUNICATION_CHANNELS,
  type PartyCommunicationChannelValue,
} from '@commerce/party-communications/dto/request/party-communication-app.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

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
