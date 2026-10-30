import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, IsUrl, MaxLength, ValidateNested } from 'class-validator';

// Who makes a verification payment: the signed-in admin, so a gateway that needs contact details on every payment
// (Easebuzz) has real ones and its page comes prefilled
export class VerificationPayerDto {
  @ApiPropertyOptional({ example: 'Shyam Sunder' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ example: 'admin@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

// What cloud adds when core opens a verification payment: core's own public origin, which core cannot know, for a
// gateway that takes the URL its result is posted to when the payment is opened, and the admin paying it
export class VerificationPaymentRequestDto {
  @ApiPropertyOptional({
    description: "Core's public origin as cloud reaches it",
    example: 'https://api.acme.vrittiai.com',
  })
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true, require_tld: false })
  @MaxLength(500)
  callbackOrigin?: string;

  @ApiPropertyOptional({ type: VerificationPayerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => VerificationPayerDto)
  payer?: VerificationPayerDto;
}
