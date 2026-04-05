import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class SaveItemModifiersDto {
  @ApiProperty({ description: 'Array of modifier group IDs to assign to the item', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  groupIds: string[];
}
