import { Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { type PartyCommunicationChannel, PartyCommunicationChannelValues } from '@/db/schema';

export class FindPartiesByCommunicationDto {
  @IsEnum(PartyCommunicationChannelValues)
  channel: PartyCommunicationChannel;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value: string;
}
