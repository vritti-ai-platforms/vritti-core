import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class BulkSetVariantsTaxClassDto {
  @IsUUID()
  offeringId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  ids: string[];

  @IsUUID()
  taxClassId: string;
}
