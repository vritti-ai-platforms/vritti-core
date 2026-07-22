import { Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { type MessagingApp, MessagingAppValues } from '@/db/schema';

export class PartyCommunicationAppInput {
  @IsEnum(MessagingAppValues)
  app: MessagingApp;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  handle?: string | null;
}
