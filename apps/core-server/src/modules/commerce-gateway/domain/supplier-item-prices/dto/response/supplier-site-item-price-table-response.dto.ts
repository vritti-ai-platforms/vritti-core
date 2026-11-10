import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { SupplierSiteItemPriceResponseDto } from './supplier-site-item-price-response.dto';

export class SupplierSiteItemPriceTableResponseDto extends TableResponseDto<SupplierSiteItemPriceResponseDto> {
  @ApiProperty({ type: [SupplierSiteItemPriceResponseDto] })
  declare result: SupplierSiteItemPriceResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
