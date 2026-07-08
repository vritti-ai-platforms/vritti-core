import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { SalesChannelResponseDto } from './sales-channel-response.dto';

export class SalesChannelTableResponseDto extends TableResponseDto<SalesChannelResponseDto> {
  @ApiProperty({ type: [SalesChannelResponseDto] })
  declare result: SalesChannelResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
