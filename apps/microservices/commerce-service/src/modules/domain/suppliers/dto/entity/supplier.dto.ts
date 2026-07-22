import { CurrencyAmountDto } from '@vritti/api-sdk/money';
import type {
  PartyLicense,
  PartyLicenseType,
  PartyTaxRegistration,
  PartyType,
  Supplier,
  SupplierItem,
  TaxRegistrationType,
} from '@/db/schema';

export class SupplierItemDto {
  id: string;
  inventoryItemId: string;
  inventoryItemName: string;
  supplierItemCode: string | null;
  unitPrice: CurrencyAmountDto | null;
  uomId: string;
  uomSymbol: string;
  minOrderQuantity: number | null;
  leadTimeDays: number | null;
  isPreferred: boolean;
  isActive: boolean;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  taxInclusive: boolean;

  static from(
    entity: SupplierItem,
    itemName?: string | null,
    uomSymbol?: string | null,
    currentUnitPrice: bigint | null = null,
  ): SupplierItemDto {
    const dto = new SupplierItemDto();
    dto.id = entity.id;
    dto.inventoryItemId = entity.inventoryItemId;
    dto.inventoryItemName = itemName ?? '';
    dto.supplierItemCode = entity.supplierItemCode ?? null;
    dto.unitPrice = CurrencyAmountDto.from(currentUnitPrice, entity.currencyCode);
    dto.uomId = entity.uomId;
    dto.uomSymbol = uomSymbol ?? '';
    dto.minOrderQuantity = entity.minOrderQuantity ?? null;
    dto.leadTimeDays = entity.leadTimeDays ?? null;
    dto.isPreferred = entity.isPreferred;
    dto.isActive = entity.isActive;
    dto.schemeBuyQty = entity.schemeBuyQty ?? null;
    dto.schemeFreeQty = entity.schemeFreeQty ?? null;
    dto.hasScheme = entity.hasScheme;
    dto.taxInclusive = entity.taxInclusive;
    return dto;
  }
}

export class SupplierItemDetailDto extends SupplierItemDto {
  supplierId: string;
  supplierCode: string;
  supplierCurrencyCode: string;

  static fromDetail(
    entity: SupplierItem & { supplierCode: string | null },
    itemName: string | null,
    uomSymbol: string | null,
    currentUnitPrice: bigint | null,
  ): SupplierItemDetailDto {
    const dto = new SupplierItemDetailDto();
    Object.assign(dto, SupplierItemDto.from(entity, itemName, uomSymbol, currentUnitPrice));
    dto.supplierId = entity.supplierId;
    dto.supplierCode = entity.supplierCode ?? '';
    dto.supplierCurrencyCode = entity.currencyCode;
    return dto;
  }
}

// Read-only projection of a supplier_items row scoped to an inventory item view
export class InventoryItemSupplierDto {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  supplierItemCode: string | null;
  unitPrice: CurrencyAmountDto | null;
  uomId: string;
  uomSymbol: string;
  minOrderQuantity: number | null;
  leadTimeDays: number | null;
  isPreferred: boolean;
  isActive: boolean;

  static from(
    entity: SupplierItem,
    supplierName?: string | null,
    supplierCode?: string | null,
    uomSymbol?: string | null,
    currentUnitPrice: bigint | null = null,
  ): InventoryItemSupplierDto {
    const dto = new InventoryItemSupplierDto();
    dto.id = entity.id;
    dto.supplierId = entity.supplierId;
    dto.supplierName = supplierName ?? '';
    dto.supplierCode = supplierCode ?? '';
    dto.supplierItemCode = entity.supplierItemCode ?? null;
    dto.unitPrice = CurrencyAmountDto.from(currentUnitPrice, entity.currencyCode);
    dto.uomId = entity.uomId;
    dto.uomSymbol = uomSymbol ?? '';
    dto.minOrderQuantity = entity.minOrderQuantity ?? null;
    dto.leadTimeDays = entity.leadTimeDays ?? null;
    dto.isPreferred = entity.isPreferred;
    dto.isActive = entity.isActive;
    return dto;
  }
}

export class SupplierRegistrationDto {
  id: string;
  registrationNumber: string;
  registrationType: TaxRegistrationType;
  isPrimary: boolean;
  isActive: boolean;

  static from(entity: PartyTaxRegistration): SupplierRegistrationDto {
    const dto = new SupplierRegistrationDto();
    dto.id = entity.id;
    dto.registrationNumber = entity.registrationNumber;
    dto.registrationType = entity.registrationType;
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
  paymentTerms: string | null;
  leadTimeDays: number | null;
  notes: string | null;
  purchasingBlocked: boolean;
  paymentBlocked: boolean;
  orderEmail: string | null;
  orderPhone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  static from(entity: Supplier, partyName: string | null = null): SupplierDto {
    const dto = new SupplierDto();
    dto.id = entity.id;
    dto.partyId = entity.partyId;
    dto.partyName = partyName ?? '';
    dto.code = entity.code;
    dto.currencyCode = entity.currencyCode;
    dto.paymentTerms = entity.paymentTerms ?? null;
    dto.leadTimeDays = entity.leadTimeDays ?? null;
    dto.notes = entity.notes ?? null;
    dto.purchasingBlocked = entity.purchasingBlocked;
    dto.paymentBlocked = entity.paymentBlocked;
    dto.orderEmail = entity.orderEmail ?? null;
    dto.orderPhone = entity.orderPhone ?? null;
    dto.isActive = entity.isActive;
    dto.createdAt = entity.createdAt.toISOString();
    dto.updatedAt = entity.updatedAt.toISOString();
    return dto;
  }
}

export class SupplierDetailDto extends SupplierDto {
  partyType: PartyType | null;
  registrations: SupplierRegistrationDto[];
  licenses: SupplierLicenseDto[];
  enrolledSiteCount: number;

  static fromDetail(
    entity: Supplier,
    partyName: string | null = null,
    detail?: {
      partyType?: PartyType | null;
      registrations: PartyTaxRegistration[];
      licenses: PartyLicense[];
      enrolledSiteCount: number;
    },
  ): SupplierDetailDto {
    const dto = new SupplierDetailDto();
    Object.assign(dto, SupplierDto.from(entity, partyName));
    dto.partyType = detail?.partyType ?? null;
    dto.registrations = (detail?.registrations ?? []).map(SupplierRegistrationDto.from);
    dto.licenses = (detail?.licenses ?? []).map(SupplierLicenseDto.from);
    dto.enrolledSiteCount = detail?.enrolledSiteCount ?? 0;
    return dto;
  }
}
