import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
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
