import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class ReorderSitesInternalDto {
  @ApiProperty({ description: 'Site IDs of the same legal entity in their new left-to-right order', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
