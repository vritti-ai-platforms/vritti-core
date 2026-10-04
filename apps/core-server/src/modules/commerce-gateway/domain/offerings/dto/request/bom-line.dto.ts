import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsUUID } from 'class-validator';

export class AddBomLineDto {
  @ApiProperty({ description: 'Inventory item this variant draws on' })
  @IsUUID('7')
  inventoryItemId: string;

  @ApiProperty({ description: 'Quantity consumed per one of this variant', example: 1 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity: number;

  @ApiProperty({ description: "Unit the quantity is in; converted to the item's stocking unit" })
  @IsUUID('7')
  uomId: string;
}

export class UpdateBomLineDto {
  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('7')
  uomId?: string;
}
