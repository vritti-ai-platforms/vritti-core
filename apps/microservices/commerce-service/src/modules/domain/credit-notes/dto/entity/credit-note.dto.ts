import type { CreditNote, CreditNoteApplication } from '@/db/schema';

export class CreditNoteApplicationDto {
  id: string;
  creditNoteId: string;
  invoiceId: string;
  amount: number;
  appliedAt: string;

  static from(entity: CreditNoteApplication): CreditNoteApplicationDto {
    const dto = new CreditNoteApplicationDto();
    dto.id = entity.id;
    dto.creditNoteId = entity.creditNoteId;
    dto.invoiceId = entity.invoiceId;
    dto.amount = Number(entity.amount);
    dto.appliedAt = entity.appliedAt.toISOString();
    return dto;
  }
}

export class CreditNoteDto {
  id: string;
  type: string;
  partyType: string;
  partyId: string | null;
  partyName: string;
  creditNoteNumber: string;
  amount: number;
  appliedAmount: number;
  remaining: number;
  reason: string | null;
  status: string;
  issuedBy: string | null;
  createdAt: string;

  static from(entity: CreditNote): CreditNoteDto {
    const dto = new CreditNoteDto();
    dto.id = entity.id;
    dto.type = entity.type;
    dto.partyType = entity.partyType;
    dto.partyId = entity.partyId ?? null;
    dto.partyName = entity.partyName;
    dto.creditNoteNumber = entity.creditNoteNumber;
    dto.amount = Number(entity.amount);
    dto.appliedAmount = Number(entity.appliedAmount);
    dto.remaining = Number(entity.remaining);
    dto.reason = entity.reason ?? null;
    dto.status = entity.status;
    dto.issuedBy = entity.issuedBy ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}

export class CreditNoteDetailDto extends CreditNoteDto {
  applications: CreditNoteApplicationDto[];

  static fromDetail(entity: CreditNote, applications: CreditNoteApplicationDto[]): CreditNoteDetailDto {
    const dto = new CreditNoteDetailDto();
    Object.assign(dto, CreditNoteDto.from(entity));
    dto.applications = applications;
    return dto;
  }
}
