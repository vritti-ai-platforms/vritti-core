import { UpdateSupplierEnrollmentDto } from '@domain/supplier-enrollments/dto/request/update-supplier-enrollment.dto';
import { IsUUID } from 'class-validator';

export class LeUpdateSupplierEnrollmentDto extends UpdateSupplierEnrollmentDto {
  @IsUUID('7')
  siteId: string;
}
