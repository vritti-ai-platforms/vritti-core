import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class GroupMatrixQueryDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  siteIds: string[];
}
