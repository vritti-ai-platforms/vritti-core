import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class ReorderOfferingDimensionsDto {
  @ApiProperty({ type: [String], description: "Every one of the offering's dimension ids, in the new order" })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  dimensionIds: string[];
}
