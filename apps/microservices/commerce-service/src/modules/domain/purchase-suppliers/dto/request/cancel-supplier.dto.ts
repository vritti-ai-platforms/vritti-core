import { Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export const CancelledQuantityValues = {
  RETURN: 'RETURN',
  DROP: 'DROP',
} as const;

export type CancelledQuantity = (typeof CancelledQuantityValues)[keyof typeof CancelledQuantityValues];

export class CancelSupplierDto {
  @IsUUID('7')
  id: string;

  @IsUUID('7')
  legId: string;

  @IsIn(Object.values(CancelledQuantityValues))
  quantity: CancelledQuantity;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
