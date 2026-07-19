import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/database';
import { SiteSupplierItemResponseDto } from './site-supplier-item-response.dto';

export class SiteSupplierItemTableResponseDto extends TableResponseDto<SiteSupplierItemResponseDto> {
  @ApiProperty({ type: [SiteSupplierItemResponseDto] })
  declare result: SiteSupplierItemResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
