import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkSetVariantsTaxClassDto {
  @ApiProperty({ type: [String], description: 'Each variant is pinned to this class and stops following the offering' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];

  @ApiProperty()
  @IsUUID()
  taxClassId: string;
}
