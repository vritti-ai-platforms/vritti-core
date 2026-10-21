import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePaymentGatewayConfigDto {
  @ApiProperty({ description: 'Gateway provider code', example: 'razorpay' })
  @Trim({ nullify: false })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsCode()
  gatewayCode: string;

  @ApiProperty({
    description: 'Tells this gateway apart from the others; unique within its group',
    example: 'Main Razorpay',
  })
  @Trim({ nullify: false })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label: string;

  @ApiProperty({
    description: 'Provider credentials keyed by field name; the required keys depend on gatewayCode',
    example: { key_id: 'rzp_live_AbCdEf123456', key_secret: 'xxxxxxxxxxxxxxxx' },
  })
  @IsObject()
  credentials: Record<string, string>;

  @ApiPropertyOptional({ description: 'Webhook signing secret issued by the provider' })
  @Trim()
  @IsOptional()
  @IsString()
  webhookSecret?: string | null;

  @ApiProperty({ description: "The main account's id at the gateway", example: 'acc_Tpmw33BnyMhFUf' })
  @Trim({ nullify: false })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  gatewayAccountId: string;

  @ApiPropertyOptional({ description: "The catalog gateway's logo for light backgrounds, set by Vritti Cloud" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  logoLightUrl?: string | null;

  @ApiPropertyOptional({ description: "The catalog gateway's logo for dark backgrounds, set by Vritti Cloud" })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  logoDarkUrl?: string | null;
}
