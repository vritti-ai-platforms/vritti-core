import type { PartyIdentifierType } from '@/db/schema';
import type { SupplierEnrollmentDetailRecord } from '../../repositories/supplier-enrollments.repository';
import { SupplierEnrollmentRowDto } from './supplier-enrollment-row.dto';

export class SupplierEnrollmentDetailDto extends SupplierEnrollmentRowDto {
  partyTaxId: string | null;
  partyTaxIdType: PartyIdentifierType | null;

  // Maps one (supplier, site) pair, enrolled or not, with the supplier's tax ID
  static fromDetail(row: SupplierEnrollmentDetailRecord): SupplierEnrollmentDetailDto {
    const dto = new SupplierEnrollmentDetailDto();
    Object.assign(dto, SupplierEnrollmentRowDto.from(row));
    dto.partyTaxId = row.partyTaxId ?? null;
    dto.partyTaxIdType = row.partyTaxIdType ?? null;
    return dto;
  }
}
