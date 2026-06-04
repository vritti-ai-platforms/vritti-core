import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk';
import { TableResponseDto } from '@vritti/api-sdk';
import { CatalogResponseDto } from './catalog-response.dto';

export class CatalogTableResponseDto extends TableResponseDto<CatalogResponseDto> {
  @ApiProperty({ type: [CatalogResponseDto] })
  declare result: CatalogResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
