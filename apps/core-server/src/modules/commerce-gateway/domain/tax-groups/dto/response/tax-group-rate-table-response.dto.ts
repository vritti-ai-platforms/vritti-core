import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { TaxGroupRateResponseDto } from './tax-group-rate-response.dto';

export class TaxGroupRateTableResponseDto extends TableResponseDto<TaxGroupRateResponseDto> {
  @ApiProperty({ type: [TaxGroupRateResponseDto] })
  declare result: TaxGroupRateResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional({ nullable: true })
  declare activeViewId: string | null;
}
