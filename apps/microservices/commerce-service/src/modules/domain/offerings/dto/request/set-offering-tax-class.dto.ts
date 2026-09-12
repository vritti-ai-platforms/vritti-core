import { IsUUID } from 'class-validator';

export class SetOfferingTaxClassDto {
  @IsUUID()
  id: string;

  @IsUUID()
  taxClassId: string;
}
