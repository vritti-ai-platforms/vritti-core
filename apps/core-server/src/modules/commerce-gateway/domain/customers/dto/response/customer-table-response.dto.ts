import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/data-table';
import { CustomerResponseDto } from './customer-response.dto';

export class CustomerTableResponseDto extends TableResponseDto<CustomerResponseDto> {
  @ApiProperty({ type: [CustomerResponseDto] })
  declare result: CustomerResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
