import { IsNotEmpty, IsNumber, IsOptional, IsUUID } from 'class-validator';

export class UpdateChangeLineDto {
  @IsUUID('7')
  @IsNotEmpty()
  adjustmentId: string;

  @IsUUID('7')
  @IsNotEmpty()
  lineId: string;

  @IsOptional()
  @IsUUID('7')
  quantId?: string;

  @IsOptional()
  @IsNumber()
  uomQty?: number;

  @IsOptional()
  @IsUUID('7')
  uomId?: string;
}
