import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class UpdateGoodsReceiptItemDto {
  @ApiPropertyOptional({ description: 'Inventory item ID' })
  @IsOptional()
  @IsUUID()
  inventoryItemId?: string;

  @ApiPropertyOptional({ description: 'Accepted quantity for this GR item' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  acceptedQuantity?: number;

  @ApiPropertyOptional({ description: 'Rejected quantity for this GR item' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;
}
