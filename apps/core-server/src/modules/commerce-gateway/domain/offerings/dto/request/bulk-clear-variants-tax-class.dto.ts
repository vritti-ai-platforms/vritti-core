import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkClearVariantsTaxClassDto {
  @ApiProperty({ type: [String], description: 'Each variant drops its override and follows the offering again' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];
}
