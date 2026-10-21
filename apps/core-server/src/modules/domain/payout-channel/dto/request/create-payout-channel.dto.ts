import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { type PaymentChannelType, PaymentChannelTypeValues } from '@/db/schema';

// The legal entity is the payout account's own
export class CreatePayoutChannelDto {
  @ApiProperty({ description: 'The payout account this scope pays out to', example: 'uuid-here' })
  @IsUUID()
  payoutAccountId: string;

  @ApiPropertyOptional({ description: 'Narrows the channel to one site of the legal entity', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  siteId?: string;

  @ApiPropertyOptional({ description: 'Narrows the channel to one app; requires channel APP', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  appId?: string;

  @ApiPropertyOptional({
    description: 'Narrows the channel to one sales channel',
    enum: Object.values(PaymentChannelTypeValues),
    example: 'APP',
  })
  @IsOptional()
  @IsEnum(PaymentChannelTypeValues)
  channel?: PaymentChannelType;
}
