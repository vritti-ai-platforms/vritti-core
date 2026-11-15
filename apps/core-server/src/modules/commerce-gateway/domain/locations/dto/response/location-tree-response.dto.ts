import { ApiProperty } from '@nestjs/swagger';
import { LocationFillResponseDto } from './location-fill-response.dto';

export class LocationTreeResponseDto {
  @ApiProperty({ description: 'Location ID' })
  id: string;

  @ApiProperty({ description: 'Location name' })
  name: string;

  @ApiProperty({ description: 'Location role (ZONE / STORAGE / RESERVED_STORAGE)' })
  locationRole: string;

  @ApiProperty({ description: 'Storage type of the location; null when it has none', type: String, nullable: true })
  storageTypeId: string | null;

  @ApiProperty({ description: 'Name of the storage type; null when it has none', type: String, nullable: true })
  storageTypeName: string | null;

  @ApiProperty({
    description: 'Whether the storage type is set on the location itself rather than inherited from a zone',
  })
  isStorageTypeOverridden: boolean;

  @ApiProperty({
    description:
      'Name of the ancestor zone the storage type is inherited from; null when the type is overridden or there is none',
    type: String,
    nullable: true,
  })
  inheritedFromLocationName: string | null;

  @ApiProperty({
    description: 'How full the location is — a zone rolls up its STORAGE locations',
    type: () => LocationFillResponseDto,
  })
  fill: LocationFillResponseDto;

  @ApiProperty({
    description: 'Child locations',
    type: () => LocationTreeResponseDto,
    isArray: true,
    required: false,
  })
  children?: LocationTreeResponseDto[];
}
