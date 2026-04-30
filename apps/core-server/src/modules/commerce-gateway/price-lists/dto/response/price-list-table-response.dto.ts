import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk';
import { PriceListResponseDto } from './price-list-response.dto';

export class PriceListTableResponseDto extends TableResponseDto<PriceListResponseDto> {
  @ApiProperty({ type: [PriceListResponseDto] })
  declare result: PriceListResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
