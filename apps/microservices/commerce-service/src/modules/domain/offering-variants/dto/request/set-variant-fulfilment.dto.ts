import { IsEnum, IsUUID } from 'class-validator';
import { FulfilmentTypeValues } from '@/db/schema';

export class SetVariantFulfilmentDto {
  @IsUUID('7')
  id: string;

  @IsEnum(FulfilmentTypeValues)
  fulfilmentType: keyof typeof FulfilmentTypeValues;
}
