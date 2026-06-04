import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const SALES_CHANNEL_KINDS = ['IN_STORE', 'ONLINE', 'ZOMATO', 'SWIGGY', 'OTHER'] as const;
export type SalesChannelKind = (typeof SALES_CHANNEL_KINDS)[number];

export class CreateSalesChannelDto {
  @ApiProperty({ description: 'Unique code within the org', example: 'IN_STORE' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Human-readable name', example: 'In Store' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    description: 'Canonical channel kind — fixed enum used as the integration identity',
    enum: SALES_CHANNEL_KINDS,
  })
  @IsEnum(SALES_CHANNEL_KINDS)
  kind: SalesChannelKind;

  @ApiPropertyOptional({ description: 'Whether the channel is selectable', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
