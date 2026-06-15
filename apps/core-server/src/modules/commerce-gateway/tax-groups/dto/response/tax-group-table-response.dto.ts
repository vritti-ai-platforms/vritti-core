import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk';
import { TaxGroupResponseDto } from './tax-group-response.dto';

export class TaxGroupTableResponseDto extends TableResponseDto<TaxGroupResponseDto> {
  @ApiProperty({ type: [TaxGroupResponseDto] })
  declare result: TaxGroupResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional({ nullable: true })
  declare activeViewId: string | null;
}
