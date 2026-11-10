import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { SupplierResponseDto } from './supplier-response.dto';

export class SupplierTableResponseDto extends TableResponseDto<SupplierResponseDto> {
  @ApiProperty({ type: [SupplierResponseDto] })
  declare result: SupplierResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
