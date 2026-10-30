import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetSupplierActiveDto {
  @ApiProperty({ description: 'Whether the supplier can be used in procurement' })
  @IsBoolean()
  isActive: boolean;
}
