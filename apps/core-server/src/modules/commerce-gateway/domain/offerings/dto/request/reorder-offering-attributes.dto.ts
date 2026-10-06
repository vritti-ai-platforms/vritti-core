import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class ReorderOfferingAttributesDto {
  @ApiProperty({ type: [String], description: "Every one of the offering's attribute ids, in the new order" })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('7', { each: true })
  attributeIds: string[];
}
