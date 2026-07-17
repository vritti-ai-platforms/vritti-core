import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class AddOpeningLineDto {
  @IsUUID()
  @IsNotEmpty()
  adjustmentId: string;

  @IsUUID()
  locationId: string;

  @IsOptional()
  @IsUUID()
  stockAdjustmentLotId?: string | null;

  @IsNumber()
  uomQty: number;

  @IsUUID()
  uomId: string;
}
