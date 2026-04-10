import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';

export class CreateBomLineDto {
  @IsUUID()
  inventoryItemId: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  requiredQuantity: number;
}

export class CreateBomDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBomLineDto)
  lines?: CreateBomLineDto[];
}
