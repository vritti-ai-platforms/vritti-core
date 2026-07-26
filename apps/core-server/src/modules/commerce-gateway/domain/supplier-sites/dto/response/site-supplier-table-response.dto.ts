import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/database';
import { SiteSupplierResponseDto } from './site-supplier-response.dto';

export class SiteSupplierTableResponseDto extends TableResponseDto<SiteSupplierResponseDto> {
  @ApiProperty({ type: [SiteSupplierResponseDto] })
  declare result: SiteSupplierResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
