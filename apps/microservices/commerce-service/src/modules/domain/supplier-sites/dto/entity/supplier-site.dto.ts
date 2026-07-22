import type { SupplierSite, TaxRegistrationType } from '@/db/schema';

export class SupplierSiteDto {
  id: string;
  supplierId: string;
  siteId: string;
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Maps a SupplierSite entity with optional joined pick details to a SupplierSiteDto
  static from(
    entity: SupplierSite & {
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
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

// Site-workspace projection of an enrollment row joined with supplier commercial identity
export class SiteSupplierDto {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  currencyCode: string;
  partyTaxRegistrationId: string | null;
  partyBankAccountId: string | null;
  purchasingBlocked: boolean;
  isActive: boolean;
  createdAt: string;

  static from(
    entity: SupplierSite & {
      supplierName: string | null;
      supplierCode: string | null;
      currencyCode: string | null;
      purchasingBlocked: boolean | null;
    },
  ): SiteSupplierDto {
    const dto = new SiteSupplierDto();
    dto.id = entity.id;
    dto.supplierId = entity.supplierId;
    dto.supplierName = entity.supplierName ?? '';
    dto.supplierCode = entity.supplierCode ?? '';
    dto.currencyCode = entity.currencyCode ?? '';
    dto.partyTaxRegistrationId = entity.partyTaxRegistrationId ?? null;
    dto.partyBankAccountId = entity.partyBankAccountId ?? null;
    dto.purchasingBlocked = entity.purchasingBlocked ?? false;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }
}
