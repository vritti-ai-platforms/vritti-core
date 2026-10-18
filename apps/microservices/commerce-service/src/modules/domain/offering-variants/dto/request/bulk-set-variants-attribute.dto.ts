import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkSetVariantsAttributeDto {
  @IsUUID('7')
  offeringId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];

  @IsUUID('7')
  attributeId: string;

  // Empty-allowed, and that is how this attribute is cleared across the selection.
  @IsArray()
  @IsUUID('7', { each: true })
  valueIds: string[];
}
