import { IsEnum, IsUUID } from 'class-validator';
import { FulfilmentTypeValues } from '@/db/schema';

export class SetOfferingFulfilmentDto {
  @IsUUID()
  id: string;

  @IsEnum(FulfilmentTypeValues)
  fulfilmentType: keyof typeof FulfilmentTypeValues;
}
