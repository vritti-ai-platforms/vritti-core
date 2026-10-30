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

export type SiteTermsRow = {
  itemSiteId: string | null;
  siteIsPreferred: boolean | null;
  siteLeadTimeDays: number | null;
  siteIsLeadTimeOverridden: boolean | null;
  currentUnitPrice: bigint | null;
  currentCurrencyCode: string | null;
  currentSchemeBuyQty: number | null;
  currentSchemeFreeQty: number | null;
  currentTaxInclusive: boolean | null;
};

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
  leadTimeDays: number | null;
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
    dto.leadTimeDays = entity.leadTimeDays ?? null;
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

// One site's terms for a supplier item — its operational settings and the price in force today
export class SiteSupplierItemTermsDto {
  itemSiteId: string | null;
  isPreferred: boolean;
  leadTimeDays: number | null;
  isLeadTimeOverridden: boolean;
  minOrderQuantity: number | null;
  unitPrice: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  taxInclusive: boolean;

  // The minimum order is the supplier item's own, the same at every site
  static assign<T extends SiteSupplierItemTermsDto>(
    dto: T,
    row: SiteTermsRow & { minOrderQuantity: number | null },
  ): T {
    dto.itemSiteId = row.itemSiteId ?? null;
    dto.isPreferred = row.siteIsPreferred ?? false;
    dto.leadTimeDays = row.siteLeadTimeDays ?? null;
    dto.isLeadTimeOverridden = row.siteIsLeadTimeOverridden ?? false;
    dto.minOrderQuantity = row.minOrderQuantity ?? null;
    dto.unitPrice = row.currentCurrencyCode
      ? CurrencyAmountDto.from(row.currentUnitPrice, row.currentCurrencyCode)
      : null;
    dto.schemeBuyQty = row.currentSchemeBuyQty ?? null;
    dto.schemeFreeQty = row.currentSchemeFreeQty ?? null;
    dto.hasScheme = dto.schemeBuyQty != null && dto.schemeFreeQty != null;
    dto.taxInclusive = row.currentTaxInclusive ?? false;
    return dto;
  }
}

export class SiteSupplierItemDto extends SupplierItemDto {
  itemSiteId: string | null;
  isPreferred: boolean;
  isLeadTimeOverridden: boolean;
  unitPrice: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  taxInclusive: boolean;

  static fromSite(
    entity: SupplierItem & SiteTermsRow,
    itemName?: string | null,
    uomSymbol?: string | null,
  ): SiteSupplierItemDto {
    const dto = new SiteSupplierItemDto();
    Object.assign(dto, SupplierItemDto.from(entity, itemName, uomSymbol));
    return SiteSupplierItemTermsDto.assign(dto, entity);
  }
}

export class SiteSupplierItemDetailDto extends SupplierItemDetailDto {
  itemSiteId: string | null;
  isPreferred: boolean;
  isLeadTimeOverridden: boolean;
  unitPrice: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  taxInclusive: boolean;

  static fromSiteDetail(
    entity: SupplierItem &
      SiteTermsRow & {
        supplierCode: string | null;
        supplierCurrencyCode: string;
        supplierCurrencyCodes: string[];
        priceCount: number;
        pricedSiteCount: number;
      },
    itemName: string | null,
    uomSymbol: string | null,
  ): SiteSupplierItemDetailDto {
    const dto = new SiteSupplierItemDetailDto();
    Object.assign(dto, SupplierItemDetailDto.fromDetail(entity, itemName, uomSymbol));
    return SiteSupplierItemTermsDto.assign(dto, entity);
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
  itemSiteId: string | null;
  isPreferred: boolean;
  leadTimeDays: number | null;
  isLeadTimeOverridden: boolean;
  minOrderQuantity: number | null;
  unitPrice: CurrencyAmountDto | null;
  schemeBuyQty: number | null;
  schemeFreeQty: number | null;
  hasScheme: boolean;
  taxInclusive: boolean;

  static from(
    entity: SupplierItem & SiteTermsRow & { siteCount: number },
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
    return SiteSupplierItemTermsDto.assign(dto, entity);
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
  currencyCodes: string[];
  defaultPaymentTermId: string | null;
  defaultPaymentTermName: string | null;
  notes: string | null;
  purchasingBlocked: boolean;
  paymentBlocked: boolean;
  orderEmail: string | null;
  orderPhone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  static from(
    entity: Supplier & { defaultPaymentTermName?: string | null },
    partyName: string | null = null,
  ): SupplierDto {
    const dto = new SupplierDto();
    dto.id = entity.id;
    dto.partyId = entity.partyId;
    dto.partyName = partyName ?? '';
    dto.code = entity.code;
    dto.currencyCode = entity.currencyCode;
    dto.currencyCodes = entity.currencyCodes;
    dto.defaultPaymentTermId = entity.defaultPaymentTermId ?? null;
    dto.defaultPaymentTermName = entity.defaultPaymentTermName ?? null;
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
  itemCount: number;

  static fromDetail(
    entity: Supplier & { defaultPaymentTermName?: string | null },
    partyName: string | null = null,
    detail?: {
      partyType?: PartyType | null;
      registrations: PartyTaxRegistration[];
      licenses: PartyLicense[];
      enrolledSiteCount: number;
      itemCount: number;
    },
  ): SupplierDetailDto {
    const dto = new SupplierDetailDto();
    Object.assign(dto, SupplierDto.from(entity, partyName));
    dto.partyType = detail?.partyType ?? null;
    dto.registrations = (detail?.registrations ?? []).map(SupplierRegistrationDto.from);
    dto.licenses = (detail?.licenses ?? []).map(SupplierLicenseDto.from);
    dto.enrolledSiteCount = detail?.enrolledSiteCount ?? 0;
    dto.itemCount = detail?.itemCount ?? 0;
    return dto;
  }
}
