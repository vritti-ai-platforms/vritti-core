import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { CatalogResponseDto } from './catalog-response.dto';

export class CatalogTableResponseDto extends TableResponseDto<CatalogResponseDto> {
  @ApiProperty({ type: [CatalogResponseDto] })
  declare result: CatalogResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
