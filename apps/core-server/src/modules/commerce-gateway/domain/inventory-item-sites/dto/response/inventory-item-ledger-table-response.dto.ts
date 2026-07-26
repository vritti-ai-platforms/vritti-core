import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { InventoryItemLedgerResponseDto } from './inventory-item-ledger-response.dto';

export class InventoryItemLedgerTableResponseDto extends TableResponseDto<InventoryItemLedgerResponseDto> {
  @ApiProperty({ type: [InventoryItemLedgerResponseDto] })
  declare result: InventoryItemLedgerResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
