import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk';
import { TableResponseDto } from '@vritti/api-sdk';
import { StorageLocationResponseDto } from './storage-location-response.dto';

export class StorageLocationChildrenTableResponseDto extends TableResponseDto<StorageLocationResponseDto> {
  @ApiProperty({ type: [StorageLocationResponseDto] })
  declare result: StorageLocationResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
