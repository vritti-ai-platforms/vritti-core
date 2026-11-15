import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Matches } from 'class-validator';

export class CreatePurchaseItemDto {
  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID('7')
  inventoryItemId: string;

  @ApiProperty({ description: "Quantity needed, in the item's primary unit", example: 100 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  primaryQty: number;

  @ApiPropertyOptional({ description: 'Date the item is needed by (YYYY-MM-DD)', example: '2026-11-20' })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'neededBy must be YYYY-MM-DD' })
  neededBy?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
