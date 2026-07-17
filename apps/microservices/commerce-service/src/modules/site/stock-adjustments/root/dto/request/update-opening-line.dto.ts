import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class UpdateOpeningLineDto {
  @IsUUID()
  @IsNotEmpty()
  adjustmentId: string;

  @IsUUID()
  @IsNotEmpty()
  lineId: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsUUID()
  stockAdjustmentLotId?: string | null;

  @IsOptional()
  @IsNumber()
  uomQty?: number;

  @IsOptional()
  @IsUUID()
  uomId?: string;
}
