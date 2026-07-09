import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TableViewState } from '@vritti/api-sdk/database';
import { TableResponseDto } from '@vritti/api-sdk/database';
import { LocationResponseDto } from './location-response.dto';

export class LocationChildrenTableResponseDto extends TableResponseDto<LocationResponseDto> {
  @ApiProperty({ type: [LocationResponseDto] })
  declare result: LocationResponseDto[];

  @ApiProperty()
  declare count: number;

  @ApiProperty()
  declare state: TableViewState;

  @ApiPropertyOptional()
  declare activeViewId: string | null;
}
