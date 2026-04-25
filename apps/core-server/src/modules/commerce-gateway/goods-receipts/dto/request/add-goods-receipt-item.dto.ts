import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddGoodsReceiptItemDto {
  @ApiProperty({ description: 'Inventory item ID' })
  @IsUUID()
  inventoryItemId: string;

  @ApiProperty({ description: 'Accepted quantity for this GR item' })
  @IsNumber()
  @Min(0)
  acceptedQuantity: number;

  @ApiPropertyOptional({ description: 'Rejected quantity for this GR item' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;
}
