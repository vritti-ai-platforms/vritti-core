import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk';
import { TableResponseDto } from '@vritti/api-sdk';
import { SupplierResponseDto } from './supplier-response.dto';

export class SupplierTableResponseDto extends TableResponseDto<SupplierResponseDto> {
  @ApiProperty({ type: [SupplierResponseDto] })
  declare result: SupplierResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
