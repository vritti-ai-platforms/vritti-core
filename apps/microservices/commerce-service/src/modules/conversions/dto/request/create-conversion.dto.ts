import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ConversionLineDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  wastageQuantity?: number;
}

export class CreateConversionDto {
  @IsUUID()
  locationId: string;

  @IsOptional()
  @IsUUID()
  bomId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsUUID()
  producedBy?: string;

  @IsOptional()
  @IsString()
  startedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversionLineDto)
  inputs: ConversionLineDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConversionLineDto)
  outputs: ConversionLineDto[];
}
