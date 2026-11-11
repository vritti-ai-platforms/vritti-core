import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsUUID('7')
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  status: string;
}
