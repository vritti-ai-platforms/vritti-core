import { IsBoolean, IsUUID } from 'class-validator';

export class SetSupplierActiveDto {
  @IsUUID('7')
  id: string;

  @IsBoolean()
  isActive: boolean;
}
