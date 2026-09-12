import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class GroupMatrixQueryDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  siteIds: string[];
}
