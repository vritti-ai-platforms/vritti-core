import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

export class UpdateSupplierDto {
  @IsUUID()
  id: string;

  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  purchasingBlocked?: boolean;

  @IsOptional()
  @IsBoolean()
  paymentBlocked?: boolean;

  @Trim()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  orderEmail?: string | null;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  orderPhone?: string | null;
}
