import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetAttributeTemplateActiveDto {
  @ApiProperty({ description: 'Whether the template can be applied to new attributes' })
  @IsBoolean()
  isActive: boolean;
}
