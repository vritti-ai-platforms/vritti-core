import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { SupplierItemResponseDto } from './supplier-item-response.dto';

export class SupplierItemTableResponseDto extends TableResponseDto<SupplierItemResponseDto> {
  @ApiProperty({ type: [SupplierItemResponseDto] })
  declare result: SupplierItemResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
