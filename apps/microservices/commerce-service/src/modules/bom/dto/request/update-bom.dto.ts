import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateBomLineDto {
  @IsUUID()
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  requiredQuantity: number;
}

export class UpdateBomDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateBomLineDto)
  lines?: UpdateBomLineDto[];
}
