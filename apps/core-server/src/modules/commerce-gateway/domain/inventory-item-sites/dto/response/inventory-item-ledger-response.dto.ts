import { DisplayUomQuantityResponseDto } from '@commerce/uom/dto/response/display-uom-quantity-response.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryItemLedgerDisplayResponseDto {
  @ApiProperty({ type: DisplayUomQuantityResponseDto, nullable: true })
  quantity: DisplayUomQuantityResponseDto | null;
}

export class InventoryItemLedgerResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({
    enum: [
      'GOODS_RECEIPT',
      'ORDER_RESERVE',
      'ORDER_DEDUCT',
      'ORDER_CANCEL',
      'ADJUSTMENT',
      'CONVERSION_INPUT',
      'CONVERSION_OUTPUT',
      'TRANSFER_OUT',
      'TRANSFER_IN',
    ],
  })
  type: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  balanceAfter: number;

  @ApiPropertyOptional({ nullable: true })
  referenceType: string | null;

  @ApiPropertyOptional({ nullable: true })
  referenceId: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({
    type: InventoryItemLedgerDisplayResponseDto,
    description: "These quantities in the item's display unit",
  })
  display: InventoryItemLedgerDisplayResponseDto;
}
