import { ApiProperty } from '@nestjs/swagger';
import {
  type StorageCapacityCheck,
  StorageCapacityCheckValues,
} from '../../constants/storage-capacity-check.constants';

export class StorageTypeResponseDto {
  @ApiProperty({ description: 'Storage type ID' })
  id: string;

  @ApiProperty({ description: 'Unique code within the organization', example: 'shelf-small' })
  code: string;

  @ApiProperty({ description: 'Display name', example: 'Small shelf' })
  name: string;

  @ApiProperty({
    description: 'Most weight one location holds, in grams (g); null when there is no weight limit',
    type: Number,
    nullable: true,
  })
  maxWeight: number | null;

  @ApiProperty({
    description: 'Most volume one location holds, in millilitres (ml); null when there is no volume limit',
    type: Number,
    nullable: true,
  })
  maxVolume: number | null;

  @ApiProperty({ description: 'Inside length in millimetres (mm); null when not set', type: Number, nullable: true })
  length: number | null;

  @ApiProperty({ description: 'Inside width in millimetres (mm); null when not set', type: Number, nullable: true })
  width: number | null;

  @ApiProperty({ description: 'Inside height in millimetres (mm); null when not set', type: Number, nullable: true })
  height: number | null;

  @ApiProperty({
    description: 'What happens when a putaway would exceed capacity, weight or volume',
    enum: Object.values(StorageCapacityCheckValues),
  })
  capacityCheck: StorageCapacityCheck;

  @ApiProperty({ description: 'Whether one location may hold different items' })
  allowMixedItems: boolean;

  @ApiProperty({ description: 'Whether one location may hold different batches of an item' })
  allowMixedBatches: boolean;

  @ApiProperty({ description: 'Whether putaway may add to stock already in a location' })
  allowAdditionToStock: boolean;

  @ApiProperty({ description: 'Whether the storage type can be assigned to locations' })
  isActive: boolean;

  @ApiProperty({ description: 'Number of locations of this type, across all sites' })
  locationCount: number;

  @ApiProperty({ description: 'Number of inventory items allowed in this type' })
  itemCount: number;
}
