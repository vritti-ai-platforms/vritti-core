import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddGoodsReceiptItemDto {
  @ApiProperty({ description: 'Supplier item ID — server resolves to the canonical inventory item.' })
  @IsUUID()
  supplierItemId: string;

  @ApiPropertyOptional({ description: 'Damage-on-arrival quantity (does not go to inventory).' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQuantity?: number;
}
