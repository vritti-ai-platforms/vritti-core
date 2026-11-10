import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { TaxClassGroupResponseDto } from './tax-class-group-response.dto';

export class TaxClassGroupTableResponseDto extends TableResponseDto<TaxClassGroupResponseDto> {
  @ApiProperty({ type: [TaxClassGroupResponseDto] })
  declare result: TaxClassGroupResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional({ nullable: true })
  declare activeViewId: string | null;
}
