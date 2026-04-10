import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateStockTransferDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsUUID()
  @IsNotEmpty()
  fromBuId: string;

  @IsUUID()
  @IsNotEmpty()
  toBuId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsUUID()
  requestedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
