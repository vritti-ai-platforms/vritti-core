import { Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { type PartyCommunicationChannel, PartyCommunicationChannelValues } from '@/db/schema';

/**
 * Resolving the people reachable at a presented email or phone.
 *
 * The organization comes from RLS, never from this payload.
 */
export class FindPartiesByCommunicationDto {
  @IsEnum(PartyCommunicationChannelValues)
  channel: PartyCommunicationChannel;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value: string;
}
