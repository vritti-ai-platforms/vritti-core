import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableViewState } from '@vritti/api-sdk/database';
import { CatalogChannelResponseDto } from './catalog-channel-response.dto';

export class CatalogChannelTableResponseDto extends TableResponseDto<CatalogChannelResponseDto> {
  @ApiProperty({ type: [CatalogChannelResponseDto] })
  declare result: CatalogChannelResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
