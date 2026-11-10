import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { TaxComponentResponseDto } from './tax-component-response.dto';

export class TaxComponentTableResponseDto extends TableResponseDto<TaxComponentResponseDto> {
  @ApiProperty({ type: [TaxComponentResponseDto] })
  declare result: TaxComponentResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
