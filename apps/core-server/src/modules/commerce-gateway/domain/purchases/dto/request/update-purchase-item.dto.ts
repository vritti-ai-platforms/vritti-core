import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString, Matches } from 'class-validator';

export class UpdatePurchaseItemDto {
  @ApiPropertyOptional({ description: "Quantity needed, in the item's primary unit", example: 100 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  primaryQty?: number;

  @ApiPropertyOptional({ description: 'Date the item is needed by (YYYY-MM-DD); null clears it', nullable: true })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'neededBy must be YYYY-MM-DD' })
  neededBy?: string | null;

  @Trim()
  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
