import { ArrayNotEmpty, IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReorderCategoriesDto {
  @IsOptional()
  @IsUUID('7')
  parentId?: string | null;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  orderedIds: string[];
}
