import { ApiProperty } from '@nestjs/swagger';

export class StorageLocationTreeResponseDto {
  @ApiProperty({ description: 'Location ID' })
  id: string;

  @ApiProperty({ description: 'Location name' })
  name: string;

  @ApiProperty({
    description: 'Child locations',
    type: () => StorageLocationTreeResponseDto,
    isArray: true,
    required: false,
  })
  children?: StorageLocationTreeResponseDto[];
}
