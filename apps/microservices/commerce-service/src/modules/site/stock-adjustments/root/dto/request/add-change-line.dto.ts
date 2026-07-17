import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class AddChangeLineDto {
  @IsUUID()
  @IsNotEmpty()
  adjustmentId: string;

  @IsUUID()
  quantId: string;

  @IsNumber()
  uomQty: number;

  @IsUUID()
  uomId: string;
}
