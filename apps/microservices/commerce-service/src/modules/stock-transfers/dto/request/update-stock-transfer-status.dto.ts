import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateStockTransferStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsUUID()
  receivedBy?: string;
}
