import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkClearVariantsTaxClassDto {
  @IsUUID()
  offeringId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];
}
