import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReorderLocationsDto {
  @ApiPropertyOptional({ description: 'Parent location ID (null for root-level locations)', nullable: true })
  @IsOptional()
  @IsUUID('7')
  parentId?: string | null;

  @ApiProperty({ description: 'Sibling location IDs in final order', type: [String] })
  @IsArray()
  @IsUUID('7', { each: true })
  orderedIds: string[];
}
