import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class ReorderLegalEntitiesInternalDto {
  @ApiProperty({ description: 'Organization ID', example: 'uuid-here' })
  @IsUUID()
  orgId: string;

  @ApiProperty({ description: 'Sibling legal entity IDs in their new left-to-right order', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  ids: string[];
}
