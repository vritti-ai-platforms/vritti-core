import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateStockTransferDto {
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId: string;

  @IsUUID()
  @IsNotEmpty()
  fromSiteId: string;

  @IsUUID()
  @IsNotEmpty()
  toSiteId: string;

  @IsUUID()
  fromLocationId: string;

  @IsUUID()
  toLocationId: string;

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
