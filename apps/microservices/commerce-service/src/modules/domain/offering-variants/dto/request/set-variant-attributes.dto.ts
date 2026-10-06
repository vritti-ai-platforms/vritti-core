import { IsArray, IsUUID } from 'class-validator';

export class SetVariantAttributesDto {
  @IsUUID('7')
  id: string;

  // Flat, and empty-allowed: the attribute each value belongs to is derived server-side, and sending
  // nothing is how a variant's attributes are cleared
  @IsArray()
  @IsUUID('7', { each: true })
  valueIds: string[];
}
