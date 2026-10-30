import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { ItemSupplierPriceResponseDto } from './item-supplier-price-response.dto';

export class ItemSupplierPriceTableResponseDto extends TableResponseDto<ItemSupplierPriceResponseDto> {
  @ApiProperty({ type: [ItemSupplierPriceResponseDto] })
  declare result: ItemSupplierPriceResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
