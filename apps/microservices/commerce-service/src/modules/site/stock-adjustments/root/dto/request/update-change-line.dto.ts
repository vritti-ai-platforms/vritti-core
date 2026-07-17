import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class UpdateChangeLineDto {
  @IsUUID()
  @IsNotEmpty()
  adjustmentId: string;

  @IsUUID()
  @IsNotEmpty()
  lineId: string;

  @IsOptional()
  @IsUUID()
  quantId?: string;

  @IsOptional()
  @IsNumber()
  uomQty?: number;

  @IsOptional()
  @IsUUID()
  uomId?: string;
}
