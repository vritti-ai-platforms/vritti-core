import { IsUUID } from 'class-validator';

export class SetVariantTaxClassDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  taxClassId: string;
}
