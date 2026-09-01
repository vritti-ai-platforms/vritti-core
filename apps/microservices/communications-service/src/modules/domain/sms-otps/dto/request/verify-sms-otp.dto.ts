import { Trim } from '@vritti/api-sdk/decorators';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VerifySmsOtpDto {
  @IsUUID()
  appId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  code: string;
}
