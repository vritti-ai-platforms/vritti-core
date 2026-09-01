import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

const E164 = /^\+[1-9]\d{7,14}$/;

export class TestWhatsappOtpConfigDto {
  @ApiProperty({ description: 'Recipient in international format', example: '+919876543210' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Matches(E164, { message: 'Enter a phone number in international format, e.g. +919876543210' })
  recipient: string;
}
