import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/database';
import { SupplierSiteResponseDto } from './supplier-site-response.dto';

export class SupplierSiteTableResponseDto extends TableResponseDto<SupplierSiteResponseDto> {
  @ApiProperty({ type: [SupplierSiteResponseDto] })
  declare result: SupplierSiteResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
