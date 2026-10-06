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

  // Empty-allowed, and that is how this attribute is cleared across the selection. Every id must belong
  // to the named attribute, not merely to the offering — otherwise a value of another attribute would be
  // stored under this one and the delete-by-attribute above would never reach it again.
  @IsArray()
  @IsUUID('7', { each: true })
  valueIds: string[];
}
