import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReorderLocationsDto {
  @IsOptional()
  @IsUUID('7')
  parentId?: string | null;

  @IsArray()
  @IsUUID('7', { each: true })
  orderedIds: string[];
}
