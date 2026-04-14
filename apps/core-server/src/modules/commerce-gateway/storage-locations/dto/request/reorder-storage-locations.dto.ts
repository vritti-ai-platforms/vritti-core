import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReorderStorageLocationsDto {
  @ApiPropertyOptional({ description: 'Parent location ID (null for root-level locations)', nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiProperty({ description: 'Sibling location IDs in final order', type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
