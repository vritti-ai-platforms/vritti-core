import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { PaymentTermResponseDto } from './payment-term-response.dto';

export class PaymentTermTableResponseDto extends TableResponseDto<PaymentTermResponseDto> {
  @ApiProperty({ type: [PaymentTermResponseDto] })
  declare result: PaymentTermResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
