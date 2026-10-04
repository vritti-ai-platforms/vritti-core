import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateStockTransferStatusDto {
  @IsUUID('7')
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsUUID('7')
  fromLocationId: string;

  @IsUUID('7')
  toLocationId: string;

  @IsOptional()
  @IsUUID('7')
  fromBatchId?: string;

  @IsOptional()
  @IsUUID('7')
  receivedBy?: string;
}
