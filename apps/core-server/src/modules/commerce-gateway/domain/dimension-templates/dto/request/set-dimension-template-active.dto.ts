import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetDimensionTemplateActiveDto {
  @ApiProperty({ description: 'Whether the template can be applied to new dimensions' })
  @IsBoolean()
  isActive: boolean;
}
