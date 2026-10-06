import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkSetVariantsAttributeDto {
  @ApiProperty({ type: [String], format: 'uuid', description: 'Variants to set this attribute on' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];

  @ApiProperty({ format: 'uuid', description: 'The one attribute being set; the others are left alone' })
  @IsUUID('7')
  attributeId: string;

  // Empty-allowed, and that is how this attribute is cleared across the selection
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Values of this attribute to apply to every selected variant. Empty clears the attribute.',
  })
  @IsArray()
  @IsUUID('7', { each: true })
  valueIds: string[];
}
