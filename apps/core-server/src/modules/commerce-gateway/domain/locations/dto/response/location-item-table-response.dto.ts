import { ApiProperty } from '@nestjs/swagger';
import { TableResponseDto } from '@vritti/api-sdk/data-table';
import { LocationItemResponseDto } from './location-item-response.dto';

export class LocationItemTableResponseDto extends TableResponseDto<LocationItemResponseDto> {
  @ApiProperty({ type: [LocationItemResponseDto] })
  declare result: LocationItemResponseDto[];
}
