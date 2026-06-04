import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateStockTransferStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsUUID()
  fromLocationId: string;

  @IsUUID()
  toLocationId: string;

  @IsOptional()
  @IsUUID()
  fromBatchId?: string;

  @IsOptional()
  @IsUUID()
  receivedBy?: string;
}
