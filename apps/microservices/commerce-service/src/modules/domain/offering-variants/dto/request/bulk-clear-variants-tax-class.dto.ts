import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkClearVariantsTaxClassDto {
  @IsUUID('7')
  offeringId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('7', { each: true })
  ids: string[];
}
