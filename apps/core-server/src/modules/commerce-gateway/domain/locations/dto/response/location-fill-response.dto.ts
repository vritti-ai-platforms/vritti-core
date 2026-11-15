import { ApiProperty } from '@nestjs/swagger';

export class LocationFillResponseDto {
  @ApiProperty({
    description:
      'Share of the capacity (100 per location) the stock uses, as a percent; above 100 when over capacity. A zone reports the average fill of its STORAGE locations',
    example: 42.5,
  })
  capacityPercent: number;

  @ApiProperty({
    description: 'Weight of the stock held, in grams (g); a zone sums its STORAGE locations',
    example: 12500,
  })
  weightUsed: number;

  @ApiProperty({
    description:
      'Most weight the location holds, in grams (g); a zone sums its STORAGE locations. Null when the storage type has no weight limit',
    type: Number,
    nullable: true,
  })
  weightMax: number | null;

  @ApiProperty({
    description: 'Volume of the stock held, in millilitres (ml); a zone sums its STORAGE locations',
    example: 30000,
  })
  volumeUsed: number;

  @ApiProperty({
    description:
      'Most volume the location holds, in millilitres (ml); a zone sums its STORAGE locations. Null when the storage type has no volume limit',
    type: Number,
    nullable: true,
  })
  volumeMax: number | null;

  @ApiProperty({
    description:
      'Items held here with no item × storage type row for the location type, or without weight / volume, so left out of the figures above',
    example: 0,
  })
  unconfiguredItemCount: number;
}
