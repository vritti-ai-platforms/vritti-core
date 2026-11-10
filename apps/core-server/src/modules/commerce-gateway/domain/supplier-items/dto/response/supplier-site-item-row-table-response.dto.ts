import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { SupplierSiteItemRowResponseDto } from './supplier-site-item-row-response.dto';

export class SupplierSiteItemRowTableResponseDto extends TableResponseDto<SupplierSiteItemRowResponseDto> {
  @ApiProperty({ type: [SupplierSiteItemRowResponseDto] })
  declare result: SupplierSiteItemRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
