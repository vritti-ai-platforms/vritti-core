import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class RegisterPhoneNumberDto {
  @ApiProperty({
    description: 'Two-step verification PIN — set on first registration, must match the existing PIN afterwards',
    example: '000000',
  })
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'PIN must be 6 digits' })
  pin: string;
}
