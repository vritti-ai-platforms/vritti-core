import { CreateSupplierEnrollmentDto } from '@domain/supplier-enrollments/dto/request/create-supplier-enrollment.dto';
import { IsUUID } from 'class-validator';

export class LeCreateSupplierEnrollmentDto extends CreateSupplierEnrollmentDto {
  @IsUUID('7')
  siteId: string;
}
