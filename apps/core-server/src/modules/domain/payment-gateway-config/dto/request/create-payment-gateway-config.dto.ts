import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { type PaymentGatewayConfigType, PaymentGatewayConfigTypeValues } from '@/db/schema';

export class CreatePaymentGatewayConfigDto {
  @ApiProperty({ description: 'Owning legal entity ID', example: 'uuid-here' })
  @IsUUID()
  legalEntityId: string;

  @ApiProperty({ description: 'Bank account the gateway settles into', example: 'uuid-here' })
  @IsUUID()
  bankAccountId: string;

  @ApiProperty({
    description: 'Where the gateway is used',
    enum: Object.values(PaymentGatewayConfigTypeValues),
    example: 'APP',
  })
  @IsEnum(PaymentGatewayConfigTypeValues)
  type: PaymentGatewayConfigType;

  @ApiPropertyOptional({ description: 'Site the config is pinned to', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  siteId?: string | null;

  @ApiPropertyOptional({ description: 'App the config is pinned to (type must be APP)', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  appId?: string | null;

  @ApiProperty({ description: 'Gateway provider code', example: 'razorpay' })
  @Trim({ nullify: false })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @IsCode()
  gatewayCode: string;

  @ApiPropertyOptional({ description: 'Display label for the config', example: 'Storefront Razorpay' })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string | null;

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

  @ApiPropertyOptional({
    description:
      'Collect payments through this config and split them to linked accounts; the gateway must support splits',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  splitEnabled?: boolean;
}
