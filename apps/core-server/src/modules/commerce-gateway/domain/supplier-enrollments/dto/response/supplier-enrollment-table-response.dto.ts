import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { SupplierEnrollmentRowResponseDto } from './supplier-enrollment-row-response.dto';

export class SupplierEnrollmentTableResponseDto extends TableResponseDto<SupplierEnrollmentRowResponseDto> {
  @ApiProperty({ type: [SupplierEnrollmentRowResponseDto] })
  declare result: SupplierEnrollmentRowResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
