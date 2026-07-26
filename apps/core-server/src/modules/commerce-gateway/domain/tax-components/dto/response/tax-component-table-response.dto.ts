import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { TaxComponentResponseDto } from './tax-component-response.dto';

export class TaxComponentTableResponseDto extends TableResponseDto<TaxComponentResponseDto> {
  @ApiProperty({ type: [TaxComponentResponseDto] })
  declare result: TaxComponentResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
