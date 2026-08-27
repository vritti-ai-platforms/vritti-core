import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class ReorderSiteGroupsInternalDto {
  @ApiProperty({ description: 'Sibling site group IDs in their new left-to-right order', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
