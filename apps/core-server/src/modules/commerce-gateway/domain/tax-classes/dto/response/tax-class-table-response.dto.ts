import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { TaxClassTableRowResponseDto } from './tax-class-table-row-response.dto';

export class TaxClassTableResponseDto extends TableResponseDto<TaxClassTableRowResponseDto> {
  @ApiProperty({ type: [TaxClassTableRowResponseDto] })
  declare result: TaxClassTableRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
