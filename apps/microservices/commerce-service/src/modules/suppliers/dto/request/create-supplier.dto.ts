import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  contactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  gstin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  paymentTerms?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
