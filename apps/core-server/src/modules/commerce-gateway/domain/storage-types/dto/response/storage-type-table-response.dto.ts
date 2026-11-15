import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TableResponseDto, type TableState } from '@vritti/api-sdk/data-table';
import { StorageTypeResponseDto } from './storage-type-response.dto';

export class StorageTypeTableResponseDto extends TableResponseDto<StorageTypeResponseDto> {
  @ApiProperty({ type: [StorageTypeResponseDto] })
  declare result: StorageTypeResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty({ description: 'Current active filter/sort/visibility state' })
  declare state: TableState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
