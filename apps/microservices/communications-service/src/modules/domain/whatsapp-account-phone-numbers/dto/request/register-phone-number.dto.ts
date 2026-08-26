import { IsString, Length, Matches } from 'class-validator';

export class RegisterPhoneNumberDto {
  // Two-step verification PIN — set on first registration, must match the existing PIN afterwards
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  pin: string;
}
