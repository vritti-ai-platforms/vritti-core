import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { InvoiceResponseDto } from './invoice-response.dto';

export class InvoiceTableResponseDto extends TableResponseDto<InvoiceResponseDto> {
  @ApiProperty({ type: [InvoiceResponseDto] })
  declare result: InvoiceResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
