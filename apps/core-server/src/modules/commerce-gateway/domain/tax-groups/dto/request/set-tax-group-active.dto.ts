import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetTaxGroupActiveDto {
  @ApiProperty({ description: 'Whether tax classes can be mapped to the tax group' })
  @IsBoolean()
  isActive: boolean;
}
