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

  @ApiPropertyOptional({ description: 'Merchant ID assigned by the provider', example: 'MID12345' })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  providerMerchantId?: string | null;
}
