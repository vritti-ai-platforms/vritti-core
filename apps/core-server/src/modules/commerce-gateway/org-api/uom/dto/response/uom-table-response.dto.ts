import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/database';
import { UomResponseDto } from './uom-response.dto';

export class UomTableResponseDto extends TableResponseDto<UomResponseDto> {
  @ApiProperty({ type: [UomResponseDto] })
  declare result: UomResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
