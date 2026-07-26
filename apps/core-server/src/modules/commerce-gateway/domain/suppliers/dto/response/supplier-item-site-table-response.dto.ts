import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/database';
import { SupplierItemSiteResponseDto } from './supplier-item-site-response.dto';

export class SupplierItemSiteTableResponseDto extends TableResponseDto<SupplierItemSiteResponseDto> {
  @ApiProperty({ type: [SupplierItemSiteResponseDto] })
  declare result: SupplierItemSiteResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
