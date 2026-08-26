import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class RequestPhoneVerificationCodeDto {
  @ApiProperty({ description: 'How Meta delivers the verification code', enum: ['SMS', 'VOICE'], example: 'SMS' })
  @IsIn(['SMS', 'VOICE'])
  codeMethod: 'SMS' | 'VOICE';

  @ApiPropertyOptional({ description: 'Locale for the delivery message', example: 'en_US', default: 'en_US' })
  @IsOptional()
  @IsString()
  language?: string;
}
