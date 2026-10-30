import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { SupplierSiteRowResponseDto } from './supplier-site-row-response.dto';

export class SupplierSiteTableResponseDto extends TableResponseDto<SupplierSiteRowResponseDto> {
  @ApiProperty({ type: [SupplierSiteRowResponseDto] })
  declare result: SupplierSiteRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
