import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReorderCategoriesDto {
  @ApiPropertyOptional({ description: 'Parent category ID. Use null for root categories.', nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiProperty({ description: 'Ordered category IDs for siblings under parentId', type: [String] })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  orderedIds: string[];
}
