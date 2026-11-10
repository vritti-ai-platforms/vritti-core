import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetTaxClassActiveDto {
  @ApiProperty({ description: 'Whether the tax class can be picked for products' })
  @IsBoolean()
  isActive: boolean;
}
