import { IsUUID } from 'class-validator';

export class SetVariantTaxClassDto {
  @IsUUID()
  id: string;

  @IsUUID()
  taxClassId: string;
}
