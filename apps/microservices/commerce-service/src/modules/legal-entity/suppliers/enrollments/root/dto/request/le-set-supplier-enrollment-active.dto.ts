import { SetSupplierEnrollmentActiveDto } from '@domain/supplier-enrollments/dto/request/set-supplier-enrollment-active.dto';
import { IsUUID } from 'class-validator';

export class LeSetSupplierEnrollmentActiveDto extends SetSupplierEnrollmentActiveDto {
  @IsUUID('7')
  siteId: string;
}
