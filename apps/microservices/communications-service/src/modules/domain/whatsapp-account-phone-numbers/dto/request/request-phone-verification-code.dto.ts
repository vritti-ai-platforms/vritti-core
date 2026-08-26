import { IsIn, IsOptional, IsString } from 'class-validator';

export class RequestPhoneVerificationCodeDto {
  @IsIn(['SMS', 'VOICE'])
  codeMethod: 'SMS' | 'VOICE';

  @IsOptional()
  @IsString()
  language?: string;
}
