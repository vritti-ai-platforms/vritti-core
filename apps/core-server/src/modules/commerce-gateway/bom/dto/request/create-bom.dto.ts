import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';

export class CreateBomLineDto {
  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty({ description: 'Required quantity per unit', example: 300 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  requiredQuantity: number;
}

export class CreateBomDto {
  @ApiProperty({ description: 'BOM name', example: 'Chicken Biryani Full' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'BOM code', example: 'BOM-BIR-CHK-F' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @ApiPropertyOptional({ description: 'Whether BOM is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'BOM lines', type: [CreateBomLineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBomLineDto)
  lines?: CreateBomLineDto[];
}
