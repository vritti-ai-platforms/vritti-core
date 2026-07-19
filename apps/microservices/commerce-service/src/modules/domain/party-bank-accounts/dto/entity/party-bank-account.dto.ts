import type { PartyBankAccount } from '@/db/schema';

export class PartyBankAccountDto {
  id: string;
  partyId: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string | null;
  upiId: string | null;
  bankName: string | null;
  isPrimary: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a PartyBankAccount entity to a PartyBankAccountDto
  static from(entity: PartyBankAccount): PartyBankAccountDto {
    const dto = new PartyBankAccountDto();
    dto.id = entity.id;
    dto.partyId = entity.partyId;
    dto.accountName = entity.accountName;
    dto.accountNumber = entity.accountNumber;
    dto.ifscCode = entity.ifscCode ?? null;
    dto.upiId = entity.upiId ?? null;
    dto.bankName = entity.bankName ?? null;
    dto.isPrimary = entity.isPrimary;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
