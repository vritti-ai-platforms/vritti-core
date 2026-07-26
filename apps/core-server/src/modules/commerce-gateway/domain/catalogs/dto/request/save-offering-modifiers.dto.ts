import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class SaveOfferingModifiersDto {
  @ApiProperty({ description: 'Array of modifier group IDs to assign to the offering', type: [String] })
  @IsArray()
  @IsUUID('all', { each: true })
  groupIds: string[];
}
