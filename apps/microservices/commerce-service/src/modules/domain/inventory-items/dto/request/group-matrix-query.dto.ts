import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class GroupMatrixQueryDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  siteIds: string[];
}
