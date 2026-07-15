import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class GroupMatrixQueryDto {
  @ApiProperty({ type: [String], description: 'Site IDs in the group to roll up (comma-separated or repeated)' })
  @Transform(({ value }) => (Array.isArray(value) ? value : String(value).split(',').filter(Boolean)))
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  siteIds: string[];
}
