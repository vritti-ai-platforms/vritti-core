import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk';
import { TableResponseDto } from '@vritti/api-sdk';
import { InventoryLevelResponseDto } from './inventory-level-response.dto';

export class InventoryLevelTableResponseDto extends TableResponseDto<InventoryLevelResponseDto> {
  @ApiProperty({ type: [InventoryLevelResponseDto] })
  declare result: InventoryLevelResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
