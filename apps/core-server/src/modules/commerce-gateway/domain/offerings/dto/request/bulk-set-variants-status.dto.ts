import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class BulkSetVariantsStatusDto {
  @ApiProperty({ type: [String], description: 'Refused outright unless every one of them satisfies the BOM rule' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
