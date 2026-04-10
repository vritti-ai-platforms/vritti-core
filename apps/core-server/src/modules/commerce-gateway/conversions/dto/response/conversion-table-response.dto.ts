import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk';
import { TableResponseDto } from '@vritti/api-sdk';
import { ConversionResponseDto } from './conversion-response.dto';

export class ConversionTableResponseDto extends TableResponseDto<ConversionResponseDto> {
  @ApiProperty({ type: [ConversionResponseDto] })
  declare result: ConversionResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
