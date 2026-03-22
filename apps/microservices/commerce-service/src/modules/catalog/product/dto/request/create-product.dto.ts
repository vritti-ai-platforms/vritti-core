import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsUUID()
  organizationId: string;

  @IsUUID()
  businessUnitId: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsUUID()
  stationId?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
