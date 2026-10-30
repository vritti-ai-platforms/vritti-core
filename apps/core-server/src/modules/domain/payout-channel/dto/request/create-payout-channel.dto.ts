import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { type PaymentChannelType, PaymentChannelTypeValues } from '@/db/schema';

export class CreatePayoutChannelDto {
  @ApiProperty({
    description: 'The bank account this scope pays out to; its legal entity is the scope',
    example: 'uuid-here',
  })
  @IsUUID()
  bankAccountId: string;

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
