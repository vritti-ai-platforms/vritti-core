import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateLotDto {
  @IsUUID()
  @IsNotEmpty()
  adjustmentId: string;

  @IsUUID()
  @IsNotEmpty()
  lotId: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lotNumber?: string | null;

  @IsOptional()
  @IsDateString()
  manufacturingDate?: string | null;

  @IsOptional()
  @IsDateString()
  @IsNotEmpty()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  mrp?: string | null;
}
