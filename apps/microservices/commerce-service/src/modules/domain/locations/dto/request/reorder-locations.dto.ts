import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReorderLocationsDto {
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @IsArray()
  @IsUUID(undefined, { each: true })
  orderedIds: string[];
}
