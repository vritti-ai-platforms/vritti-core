import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateWhatsappPhoneNumberDto {
  @ApiProperty({ description: 'Country calling code without the plus sign', example: '91' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{1,4}$/, { message: 'Country code must be 1-4 digits' })
  cc: string;

  @ApiProperty({ description: 'National number without the country code', example: '9491700322' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,15}$/, { message: 'Phone number must be 4-15 digits' })
  phoneNumber: string;

  @ApiProperty({ description: 'Display name shown to WhatsApp users; reviewed by Meta', example: 'Vritti AI' })
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  verifiedName: string;
}
