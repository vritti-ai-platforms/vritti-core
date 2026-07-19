import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/database';
import { SupplierItemPriceResponseDto } from './supplier-item-price-response.dto';

export class SupplierItemPriceTableResponseDto extends TableResponseDto<SupplierItemPriceResponseDto> {
  @ApiProperty({ type: [SupplierItemPriceResponseDto] })
  declare result: SupplierItemPriceResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
