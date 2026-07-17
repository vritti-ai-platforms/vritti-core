import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import type { SalesChannelKind } from '@/db/schema';

export class CreateSalesChannelDto {
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsEnum(['IN_STORE', 'ONLINE', 'ZOMATO', 'SWIGGY', 'OTHER'])
  kind: SalesChannelKind;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
