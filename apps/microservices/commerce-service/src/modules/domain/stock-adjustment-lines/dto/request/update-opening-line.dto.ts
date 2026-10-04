import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class UpdateOpeningLineDto {
  @IsUUID('7')
  @IsNotEmpty()
  adjustmentId: string;

  @IsUUID('7')
  @IsNotEmpty()
  lineId: string;

  @IsOptional()
  @IsUUID('7')
  locationId?: string;

  @IsOptional()
  @IsUUID('7')
  stockAdjustmentLotId?: string | null;

  @IsOptional()
  @IsNumber()
  uomQty?: number;

  @IsOptional()
  @IsUUID('7')
  uomId?: string;
}
