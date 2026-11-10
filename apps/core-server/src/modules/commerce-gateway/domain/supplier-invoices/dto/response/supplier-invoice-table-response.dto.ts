import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { SupplierInvoiceResponseDto } from './supplier-invoice-response.dto';

export class SupplierInvoiceTableResponseDto extends TableResponseDto<SupplierInvoiceResponseDto> {
  @ApiProperty({ type: [SupplierInvoiceResponseDto] })
  declare result: SupplierInvoiceResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
