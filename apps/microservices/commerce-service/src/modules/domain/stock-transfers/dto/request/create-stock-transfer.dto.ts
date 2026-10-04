import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateStockTransferDto {
  @IsUUID('7')
  @IsNotEmpty()
  inventoryItemId: string;

  @IsUUID('7')
  @IsNotEmpty()
  fromSiteId: string;

  @IsUUID('7')
  @IsNotEmpty()
  toSiteId: string;

  @IsUUID('7')
  fromLocationId: string;

  @IsUUID('7')
  toLocationId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsOptional()
  @IsUUID('7')
  requestedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
