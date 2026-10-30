import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { SiteSupplierListRowResponseDto } from './site-supplier-list-row-response.dto';

export class SiteSupplierTableResponseDto extends TableResponseDto<SiteSupplierListRowResponseDto> {
  @ApiProperty({ type: [SiteSupplierListRowResponseDto] })
  declare result: SiteSupplierListRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
