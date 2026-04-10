import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk';
import { TableResponseDto } from '@vritti/api-sdk';
import { BomResponseDto } from './bom-response.dto';

export class BomTableResponseDto extends TableResponseDto<BomResponseDto> {
  @ApiProperty({ type: [BomResponseDto] })
  declare result: BomResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
