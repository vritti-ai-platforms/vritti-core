import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetTaxComponentActiveDto {
  @ApiProperty({ description: 'Whether tax-group rates can use the tax component' })
  @IsBoolean()
  isActive: boolean;
}
