import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsBoolean, IsUUID } from 'class-validator';

export class BulkSetSupplierActiveDto {
  @ApiProperty({ type: [String], description: 'Supplier IDs to update.' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];

  @ApiProperty({ description: 'Whether the suppliers can be used in procurement' })
  @IsBoolean()
  isActive: boolean;
}
