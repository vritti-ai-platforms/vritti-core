import { IsBoolean, IsUUID } from 'class-validator';

export class SetSupplierEnrollmentActiveDto {
  @IsUUID('7')
  supplierId: string;

  @IsBoolean()
  isActive: boolean;
}
