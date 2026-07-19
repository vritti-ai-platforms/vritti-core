import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AddLotDto {
  @IsUUID()
  @IsNotEmpty()
  adjustmentId: string;

  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lotNumber: string;

  @IsOptional()
  @IsDateString()
  manufacturingDate?: string | null;

  @IsDateString()
  @IsNotEmpty()
  expiryDate: string;

  @IsOptional()
  @IsString()
  mrp?: string | null;
}
