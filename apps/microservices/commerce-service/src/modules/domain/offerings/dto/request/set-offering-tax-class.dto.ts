import { IsUUID } from 'class-validator';

export class SetOfferingTaxClassDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  taxClassId: string;
}
