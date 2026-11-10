import {
  SupplierSiteItemTermsDto,
  type SupplierSiteItemTermsRow,
} from '@domain/supplier-items/dto/entity/supplier-site-item-terms.dto';
import type { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type {
  PartyIdentifierType,
  PartyLicense,
  PartyLicenseType,
  PartyType,
  SupplierItem,
  TaxRegistrationScheme,
  TaxRegistrationType,
} from '@/db/schema';
import type {
  SupplierDetailRow,
  SupplierRegistrationRow,
  SupplierWithParty,
} from '../../repositories/suppliers.repository';

export class SupplierItemDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  supplierItemCode: string | null;
  uomId: string;
  uomSymbol: string;
  // The least the supplier sells per order, in the item's unit
  minOrderQuantity: number | null;
  // Days from order to delivery, which every site follows unless it sets its own
  defaultLeadTimeDays: number;
  siteCount: number;
  // Sites where this supplier is the preferred one for the item
  preferredSiteCount: number;

  static from(
    entity: SupplierItem & { siteCount?: number | null; preferredSiteCount?: number | null },
    itemName?: string | null,
    uomSymbol?: string | null,
  ): SupplierItemDto {
    const dto = new SupplierItemDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = itemName ?? '';
    dto.supplierItemCode = entity.supplierItemCode ?? null;
    dto.uomId = entity.uomId;
    dto.uomSymbol = uomSymbol ?? '';
    dto.minOrderQuantity = entity.minOrderQuantity ?? null;
    dto.defaultLeadTimeDays = entity.defaultLeadTimeDays;
    dto.siteCount = Number(entity.siteCount ?? 0);
    dto.preferredSiteCount = Number(entity.preferredSiteCount ?? 0);
    return dto;
  }
}

export class SupplierItemDetailDto extends SupplierItemDto {
  supplierId: string;
  supplierCode: string;
  // The supplier's default currency, which new prices start in, and every currency a price may be in
  supplierCurrencyCode: string;
  supplierCurrencyCodes: string[];
  // Price history: an item with any can neither be deleted nor change its unit
  priceCount: number;
  pricedSiteCount: number;
  canDelete: boolean;

  static fromDetail(
    entity: SupplierItem & {
      supplierCode: string | null;
      siteCount?: number | null;
      preferredSiteCount?: number | null;
      supplierCurrencyCode: string;
      supplierCurrencyCodes: string[];
      priceCount: number;
      pricedSiteCount: number;
    },
    itemName: string | null,
    uomSymbol: string | null,
  ): SupplierItemDetailDto {
    const dto = new SupplierItemDetailDto();
    Object.assign(dto, SupplierItemDto.from(entity, itemName, uomSymbol));
    dto.supplierId = entity.supplierId;
    dto.supplierCode = entity.supplierCode ?? '';
    dto.supplierCurrencyCode = entity.supplierCurrencyCode;
    dto.supplierCurrencyCodes = entity.supplierCurrencyCodes;
    dto.priceCount = entity.priceCount;
    dto.pricedSiteCount = entity.pricedSiteCount;
    dto.canDelete = entity.priceCount === 0;
    return dto;
  }
}

// An item's supplier link with the session site's terms; site fields are empty outside a site workspace
export class InventoryItemSupplierDto {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  supplierItemCode: string | null;
  uomId: string;
  uomSymbol: string;
  // Sites the supplier item is set up at
  siteCount: number;
  supplierSiteItemId: string | null;
  isPreferred: boolean;
  leadTimeDays: number;
  isLeadTimeOverridden: boolean;
  minOrderQuantity: number | null;
  unitPrice: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  taxInclusive: boolean;

  static from(
    entity: SupplierItem & SupplierSiteItemTermsRow & { siteCount: number },
    supplierName?: string | null,
    supplierCode?: string | null,
    uomSymbol?: string | null,
  ): InventoryItemSupplierDto {
    const dto = new InventoryItemSupplierDto();
    dto.id = entity.id;
    dto.supplierId = entity.supplierId;
    dto.supplierName = supplierName ?? '';
    dto.supplierCode = supplierCode ?? '';
    dto.supplierItemCode = entity.supplierItemCode ?? null;
    dto.uomId = entity.uomId;
    dto.uomSymbol = uomSymbol ?? '';
    dto.siteCount = entity.siteCount;
    return SupplierSiteItemTermsDto.assign(dto, entity);
  }
}

export class SupplierRegistrationDto {
  id: string;
  countryCode: string;
  jurisdictionId: string | null;
  jurisdictionName: string | null;
  registrationNumber: string;
  registrationType: TaxRegistrationType;
  scheme: TaxRegistrationScheme;
  isPrimary: boolean;
  isActive: boolean;

  // Maps a party registration with its jurisdiction name — null for a national registration
  static from(entity: SupplierRegistrationRow): SupplierRegistrationDto {
    const dto = new SupplierRegistrationDto();
    dto.id = entity.id;
    dto.countryCode = entity.countryCode;
    dto.jurisdictionId = entity.jurisdictionId ?? null;
    dto.jurisdictionName = entity.jurisdictionName ?? null;
    dto.registrationNumber = entity.registrationNumber;
    dto.registrationType = entity.registrationType;
    dto.scheme = entity.scheme;
    dto.isPrimary = entity.isPrimary;
    dto.isActive = entity.isActive;
    return dto;
  }
}

export class SupplierLicenseDto {
  id: string;
  licenseType: PartyLicenseType;
  licenseNumber: string;
  region: string | null;
  validTo: string | null;
  isActive: boolean;

  static from(entity: PartyLicense): SupplierLicenseDto {
    const dto = new SupplierLicenseDto();
    dto.id = entity.id;
    dto.licenseType = entity.licenseType;
    dto.licenseNumber = entity.licenseNumber;
    dto.region = entity.region ?? null;
    dto.validTo = entity.validTo ?? null;
    dto.isActive = entity.isActive;
    return dto;
  }
}

export class SupplierDto {
  id: string;
  partyId: string;
  partyName: string;
  code: string;
  currencyCode: string;
  currencyCodes: string[];
  defaultPaymentTermId: string;
  defaultPaymentTermName: string;
  notes: string | null;
  purchasingBlocked: boolean;
  paymentBlocked: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  static from(entity: SupplierWithParty): SupplierDto {
    const dto = new SupplierDto();
    dto.id = entity.id;
    dto.partyId = entity.partyId;
    dto.partyName = entity.partyName;
    dto.code = entity.code;
    dto.currencyCode = entity.currencyCode;
    dto.currencyCodes = entity.currencyCodes;
    dto.defaultPaymentTermId = entity.defaultPaymentTermId;
    dto.defaultPaymentTermName = entity.defaultPaymentTermName;
    dto.notes = entity.notes ?? null;
    dto.purchasingBlocked = entity.purchasingBlocked;
    dto.paymentBlocked = entity.paymentBlocked;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class SupplierDetailDto extends SupplierDto {
  partyType: PartyType;
  partyTaxId: string | null;
  partyTaxIdType: PartyIdentifierType | null;
  registrations: SupplierRegistrationDto[];
  licenses: SupplierLicenseDto[];
  enrolledSiteCount: number;
  itemCount: number;

  static fromDetail(entity: SupplierDetailRow): SupplierDetailDto {
    const dto = new SupplierDetailDto();
    Object.assign(dto, SupplierDto.from(entity));
    dto.partyType = entity.partyType;
    dto.partyTaxId = entity.partyTaxId ?? null;
    dto.partyTaxIdType = entity.partyTaxIdType ?? null;
    dto.registrations = entity.registrations.map(SupplierRegistrationDto.from);
    dto.licenses = entity.licenses.map(SupplierLicenseDto.from);
    dto.enrolledSiteCount = entity.enrolledSiteCount;
    dto.itemCount = entity.itemCount;
    return dto;
  }
}
