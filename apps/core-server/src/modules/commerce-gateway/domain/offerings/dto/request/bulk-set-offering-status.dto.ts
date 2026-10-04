import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class BulkSetOfferingStatusDto {
  @ApiProperty({ type: [String], description: 'Refused outright unless every one of them may make the move' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
