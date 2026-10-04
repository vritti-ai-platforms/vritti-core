import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsUUID('7')
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
