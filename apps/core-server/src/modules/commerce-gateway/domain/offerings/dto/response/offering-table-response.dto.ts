import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { OfferingResponseDto } from './offering-response.dto';

export class OfferingTableResponseDto extends TableResponseDto<OfferingResponseDto> {
  @ApiProperty({ type: [OfferingResponseDto] })
  declare result: OfferingResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
