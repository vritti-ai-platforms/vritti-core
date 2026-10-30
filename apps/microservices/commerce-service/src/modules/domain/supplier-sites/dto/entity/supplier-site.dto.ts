import type { SupplierSite, TaxRegistrationType } from '@/db/schema';

export class SupplierSiteDto {
  id: string;
  supplierId: string;
  siteId: string;
  paymentTermId: string;
  paymentTermName: string | null;
  partyTaxRegistrationId: string | null;
  partyBankAccountId: string | null;
  registrationNumber: string | null;
  registrationType: TaxRegistrationType | null;
  bankAccountName: string | null;
  bankName: string | null;
  orderRelationshipId: string | null;
  orderContactLabel: string | null;
  orderContactName: string | null;
  orderContactEmail: string | null;
  orderContactPhone: string | null;
  createdAt: string;
  updatedAt: string;

  // Maps a SupplierSite entity with optional joined pick details to a SupplierSiteDto
  static from(
    entity: SupplierSite & {
      paymentTermName?: string | null;
      registrationNumber?: string | null;
      registrationType?: TaxRegistrationType | null;
      bankAccountName?: string | null;
      bankName?: string | null;
      orderContactLabel?: string | null;
      orderContactName?: string | null;
      orderContactEmail?: string | null;
      orderContactPhone?: string | null;
    },
  ): SupplierSiteDto {
    const dto = new SupplierSiteDto();
    dto.id = entity.id;
    dto.supplierId = entity.supplierId;
    dto.siteId = entity.siteId;
    dto.paymentTermId = entity.paymentTermId;
    dto.paymentTermName = entity.paymentTermName ?? null;
    dto.partyTaxRegistrationId = entity.partyTaxRegistrationId ?? null;
    dto.partyBankAccountId = entity.partyBankAccountId ?? null;
    dto.registrationNumber = entity.registrationNumber ?? null;
    dto.registrationType = entity.registrationType ?? null;
    dto.bankAccountName = entity.bankAccountName ?? null;
    dto.bankName = entity.bankName ?? null;
    dto.orderRelationshipId = entity.orderRelationshipId ?? null;
    dto.orderContactLabel = entity.orderContactLabel ?? null;
    dto.orderContactName = entity.orderContactName ?? null;
    dto.orderContactEmail = entity.orderContactEmail ?? null;
    dto.orderContactPhone = entity.orderContactPhone ?? null;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}
