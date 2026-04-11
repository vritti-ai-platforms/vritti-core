import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk';
import { TableResponseDto } from '@vritti/api-sdk';
import { InventoryLedgerResponseDto } from './inventory-ledger-response.dto';

export class InventoryLedgerTableResponseDto extends TableResponseDto<InventoryLedgerResponseDto> {
  @ApiProperty({ type: [InventoryLedgerResponseDto] })
  declare result: InventoryLedgerResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
