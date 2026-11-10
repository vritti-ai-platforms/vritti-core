import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { SupplierSiteItemResponseDto } from './supplier-site-item-response.dto';

export class SupplierSiteItemTableResponseDto extends TableResponseDto<SupplierSiteItemResponseDto> {
  @ApiProperty({ type: [SupplierSiteItemResponseDto] })
  declare result: SupplierSiteItemResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
