import { ArrayNotEmpty, IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReorderCategoriesDto {
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  orderedIds: string[];
}
