import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class PurchaseOrderItemDefaultsQueryDto {
  @ApiProperty({ description: 'Inventory item the new line orders' })
  @IsUUID('7')
  inventoryItemId: string;

  @ApiPropertyOptional({ description: "The unit the line orders in; the supplier's unit at the site when omitted" })
  @IsOptional()
  @IsUUID('7')
  uomId?: string;
}
