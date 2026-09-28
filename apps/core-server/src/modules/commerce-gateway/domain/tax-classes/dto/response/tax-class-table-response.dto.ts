import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { TaxClassResponseDto } from './tax-class-response.dto';

export class TaxClassTableResponseDto extends TableResponseDto<TaxClassResponseDto> {
  @ApiProperty({ type: [TaxClassResponseDto] })
  declare result: TaxClassResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
