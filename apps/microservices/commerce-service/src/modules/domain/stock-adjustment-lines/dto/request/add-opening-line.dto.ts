import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class AddOpeningLineDto {
  @IsUUID('7')
  @IsNotEmpty()
  adjustmentId: string;

  @IsUUID('7')
  locationId: string;

  @IsOptional()
  @IsUUID('7')
  stockAdjustmentLotId?: string | null;

  @IsNumber()
  uomQty: number;

  @IsUUID('7')
  uomId: string;
}
