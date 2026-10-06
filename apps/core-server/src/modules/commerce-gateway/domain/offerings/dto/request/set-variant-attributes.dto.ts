import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class SetVariantAttributesDto {
  // Flat, and empty-allowed: the attribute each value belongs to is derived server-side, and an empty
  // list is how a variant's attributes are cleared
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Every attribute value this variant carries, replacing the current set. Empty clears them.',
  })
  @IsArray()
  @IsUUID('7', { each: true })
  valueIds: string[];
}
