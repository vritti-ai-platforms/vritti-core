import { ApiProperty } from '@nestjs/swagger';

export class LocationTreeResponseDto {
  @ApiProperty({ description: 'Location ID' })
  id: string;

  @ApiProperty({ description: 'Location name' })
  name: string;

  @ApiProperty({ description: 'Location role (ZONE / STORAGE / RESERVED_STORAGE)' })
  locationRole: string;

  @ApiProperty({
    description: 'Child locations',
    type: () => LocationTreeResponseDto,
    isArray: true,
    required: false,
  })
  children?: LocationTreeResponseDto[];
}
