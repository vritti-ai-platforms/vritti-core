import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class AddChangeLineDto {
  @IsUUID('7')
  @IsNotEmpty()
  adjustmentId: string;

  @IsUUID('7')
  quantId: string;

  @IsNumber()
  uomQty: number;

  @IsUUID('7')
  uomId: string;
}
