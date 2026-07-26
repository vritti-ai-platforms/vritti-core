import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/database';
import { SiteSupplierItemPriceResponseDto } from './site-supplier-item-price-response.dto';

export class SiteSupplierItemPriceTableResponseDto extends TableResponseDto<SiteSupplierItemPriceResponseDto> {
  @ApiProperty({ type: [SiteSupplierItemPriceResponseDto] })
  declare result: SiteSupplierItemPriceResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
