import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateWhatsappPhoneNumberDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{1,4}$/)
  cc: string;

  // National number without the country code — Meta takes the two separately
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4,15}$/)
  phoneNumber: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  verifiedName: string;
}
