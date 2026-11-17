import { InventoryItemSitesDomainRepository } from '@domain/inventory-item-sites/repositories/inventory-item-sites.repository';
import type { PurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/entity/purchase-allocation.dto';
import type { CreatePurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/request/create-purchase-allocation.dto';
import type { CreatePurchaseAllocationsFromQuotationDto } from '@domain/purchase-item-allocations/dto/request/create-purchase-allocations-from-quotation.dto';
import type { UpdatePurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/request/update-purchase-allocation.dto';
import { PurchaseItemAllocationsDomainRepository } from '@domain/purchase-item-allocations/repositories/purchase-item-allocations.repository';
import {
  type AllocationContext,
  type AllocationQuantity,
  PurchaseItemAllocationsDomainService,
} from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import type { PurchaseItemRow } from '@domain/purchase-items/repositories/purchase-items.repository';
import { PurchaseItemsDomainRepository } from '@domain/purchase-items/repositories/purchase-items.repository';
import { PurchaseSuppliersDomainRepository } from '@domain/purchase-suppliers/repositories/purchase-suppliers.repository';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { PurchaseRow } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainRepository } from '@domain/purchases/repositories/purchases.repository';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import type { PurchaseQuotationItemTermsDto } from '@domain/supplier-quotations/dto/entity/purchase-quotation-item-terms.dto';
import { SupplierQuotationsDomainService } from '@domain/supplier-quotations/services/supplier-quotations.service';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import Decimal from '@vritti/api-sdk/decimal';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import _ from '@vritti/api-sdk/lodash';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { formatISO } from 'date-fns';
import type { PurchaseSupplier, Supplier } from '@/db/schema';
import { PurchasingRulesService } from '@/modules/site/purchasing-rules/services/purchasing-rules.service';

interface QuotedAllocationLine {
  term: PurchaseQuotationItemTermsDto & { purchaseItemId: string };
  item: PurchaseItemRow;
  supplier: Supplier;
  quantity: AllocationQuantity;
}

@Injectable()
export class PurchasesAllocationsService {
  private readonly logger = new Logger(PurchasesAllocationsService.name);

  constructor(
    private readonly database: PrimaryDatabaseService,
    private readonly purchasesRepository: PurchasesDomainRepository,
    private readonly purchaseItemsRepository: PurchaseItemsDomainRepository,
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly purchaseSuppliersRepository: PurchaseSuppliersDomainRepository,
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
    private readonly allocationsRepository: PurchaseItemAllocationsDomainRepository,
    private readonly suppliersService: SuppliersDomainService,
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly purchasingRulesService: PurchasingRulesService,
    private readonly supplierQuotationsService: SupplierQuotationsDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
    private readonly inventoryItemSitesRepository: InventoryItemSitesDomainRepository,
  ) {}

  // Allocates part of a purchase item to a supplier that supplies it at the site, opening the supplier's leg on its first
  // allocation; not on a purchase that requires quotations, nor for an item the site has blocked buying
  async create(dto: CreatePurchaseAllocationDto): Promise<CreateResponseDto<PurchaseAllocationDto>> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(dto.id);
    this.allocationsRepository.assertEnteredAllowed(purchase);
    const item = await this.purchaseItemsRepository.findOnPurchaseOrThrow(purchase.id, dto.purchaseItemId);
    await this.inventoryItemSitesRepository.ensurePurchasable(
      [item.inventoryItemId],
      'purchaseItemId',
      purchase.siteId,
    );
    const supplier = await this.suppliersService.findByIdOrThrow(dto.supplierId);
    await this.purchasingRulesService.assertSourced(
      supplier.id,
      purchase.siteId,
      [{ inventoryItemId: item.inventoryItemId, uomId: dto.uomId }],
      'supplierId',
    );
    const quantity: AllocationQuantity = {
      uomQty: dto.uomQty,
      primaryUomQty: await this.uomConversionsService.toPrimaryUomQuantity(item.inventoryItemId, dto.uomId, dto.uomQty),
    };

    const allocation = await this.database.runInTransaction(async () => {
      const leg = await this.findOrOpenLeg(purchase, supplier.id);
      return this.allocationsService.create(
        this.contextOf(purchase, leg, item.id, supplier),
        dto,
        quantity,
        supplier.currencyCode,
      );
    });
    this.logger.log(
      `purchases.allocations.create — ${purchase.purchaseNumber}, item: ${item.id}, supplier: ${supplier.id}`,
    );
    return {
      success: true,
      message: `"${item.inventoryItemName}" allocated on "${purchase.purchaseNumber}".`,
      data: await this.allocationsService.findById(purchase.id, allocation.id),
    };
  }

  // Allocates purchase items from posted quotation lines valid today, the named lines or every line of the named
  // quotation: each line's purchase item gets the line's unit, price and scheme for what is still to allocate of it,
  // rounded up to whole units, opening its supplier's leg when needed; items already fully allocated, and those the site
  // has blocked buying, are skipped
  async createFromQuotation(dto: CreatePurchaseAllocationsFromQuotationDto): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(dto.id);
    const lineIds = dto.supplierQuotationId
      ? await this.supplierQuotationsService.findLineIdsForPurchase(purchase.id, dto.supplierQuotationId)
      : (dto.supplierQuotationItemIds ?? []);
    const terms = this.allocationsService.requireQuotedItems(
      lineIds,
      await this.supplierQuotationsService.findPostedItemsForPurchase(
        purchase.id,
        purchase.siteId,
        lineIds,
        formatISO(new Date(), { representation: 'date' }),
      ),
    );
    const blockedItemIds = new Set(
      await this.inventoryItemSitesRepository.findBlockedItemIds(
        terms.map((term) => term.inventoryItemId),
        purchase.siteId,
      ),
    );
    const [items, factors, legs] = await Promise.all([
      this.purchaseItemsRepository.findManyOnPurchaseOrThrow(
        purchase.id,
        terms.map((term) => term.purchaseItemId),
      ),
      this.uomConversionsService.resolveFactors(
        terms.map((term) => ({ inventoryItemId: term.inventoryItemId, uomId: term.uomId })),
      ),
      this.legsService.findByPurchaseId(purchase.id),
    ]);
    const termsBySupplier = _.groupBy(terms, 'supplierId');
    const suppliers = await Promise.all(
      Object.entries(termsBySupplier).map(async ([supplierId, supplierTerms]) => {
        const [supplier] = await Promise.all([
          this.suppliersService.findByIdOrThrow(supplierId),
          this.purchasingRulesService.assertSourced(
            supplierId,
            purchase.siteId,
            supplierTerms.map((term) => ({ inventoryItemId: term.inventoryItemId, uomId: term.uomId })),
            'supplierQuotationItemIds',
          ),
        ]);
        return supplier;
      }),
    );
    const itemsById = _.keyBy(items, 'id');
    const suppliersById = _.keyBy(suppliers, 'id');
    const lines = terms.flatMap((term): QuotedAllocationLine[] => {
      if (blockedItemIds.has(term.inventoryItemId)) return [];
      const item = itemsById[term.purchaseItemId];
      const toAllocate = new Decimal(item.primaryQty).minus(item.allocatedPrimaryQty);
      if (toAllocate.lte(0)) return [];
      const factor = factors.get(term.inventoryItemId, term.uomId);
      if (!factor) {
        throw new BadRequestException({
          label: 'Unit Not Convertible',
          detail: `"${item.inventoryItemName}" has no conversion from the quoted unit to its primary unit.`,
        });
      }
      const primaryPerUnit = factor.toDecimalPlaces(3, Decimal.ROUND_HALF_UP).toNumber();
      return [
        {
          term,
          item,
          supplier: suppliersById[term.supplierId],
          quantity: this.allocationsService.quotedQuantity(toAllocate.toNumber(), primaryPerUnit),
        },
      ];
    });
    if (lines.length === 0) {
      throw new BadRequestException({
        label: 'Nothing to Allocate',
        detail: 'Every item these quotation lines quote is already fully allocated, or the site has blocked buying it.',
      });
    }

    await this.database.runInTransaction(async () => {
      const legsBySupplier = new Map<string, PurchaseSupplier>(legs.map((leg) => [leg.supplierId, leg]));
      for (const supplierId of new Set(lines.map((line) => line.supplier.id))) {
        if (legsBySupplier.has(supplierId)) continue;
        const snapshot = await this.supplierEnrollmentsService.findPurchasingSnapshot(supplierId, purchase.siteId);
        legsBySupplier.set(supplierId, await this.legsService.open(purchase, supplierId, snapshot));
      }
      await this.allocationsService.createFromQuotation(
        lines.map(({ term, item, supplier, quantity }) => ({
          context: this.contextOf(purchase, legsBySupplier.get(supplier.id) as PurchaseSupplier, item.id, supplier),
          terms: term,
          quantity,
        })),
      );
    });
    this.logger.log(`purchases.allocations.createFromQuotation — ${purchase.purchaseNumber}, lines: ${lines.length}`);
    return {
      success: true,
      message: `${pluralize('quotation line', lines.length, true)} allocated on "${purchase.purchaseNumber}".${
        blockedItemIds.size > 0 ? ` ${pluralize('item', blockedItemIds.size, true)} skipped: purchasing blocked.` : ''
      }`,
    };
  }

  // Changes an allocation's unit, quantity, price or scheme while its leg is in sourcing; for an item the site has blocked
  // buying, only without raising its quantity
  async update(dto: UpdatePurchaseAllocationDto): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(dto.id);
    const allocation = await this.allocationsRepository.findOnPurchaseOrThrow(purchase.id, dto.allocationId);
    const leg = await this.purchaseSuppliersRepository.findOnPurchaseOrThrow(
      purchase.id,
      allocation.purchaseSupplierId,
    );
    const item = await this.purchaseItemsRepository.findOnPurchaseOrThrow(purchase.id, allocation.purchaseItemId);
    const supplier = await this.suppliersService.findByIdOrThrow(leg.supplierId);
    const uomId = dto.uomId ?? allocation.uomId;
    const uomQty = dto.uomQty ?? allocation.uomQty;
    const quantity: AllocationQuantity = {
      uomQty,
      primaryUomQty: await this.uomConversionsService.toPrimaryUomQuantity(item.inventoryItemId, uomId, uomQty),
    };
    if (new Decimal(quantity.primaryUomQty).gt(allocation.primaryUomQty)) {
      await this.inventoryItemSitesRepository.ensurePurchasable([item.inventoryItemId], 'uomQty', purchase.siteId);
    }

    await this.allocationsService.update(this.contextOf(purchase, leg, item.id, supplier), allocation, dto, quantity);
    return {
      success: true,
      message: `Allocation of "${item.inventoryItemName}" updated on "${purchase.purchaseNumber}".`,
    };
  }

  // Removes an allocation while its leg is in sourcing, removing the leg with its last allocation
  async delete(id: string, allocationId: string): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesRepository.findDetailOrThrow(id);
    const allocation = await this.allocationsRepository.findOnPurchaseOrThrow(purchase.id, allocationId);
    const leg = await this.purchaseSuppliersRepository.findOnPurchaseOrThrow(
      purchase.id,
      allocation.purchaseSupplierId,
    );
    const supplier = await this.suppliersService.findByIdOrThrow(leg.supplierId);

    const isLegRemoved = await this.database.runInTransaction(async () => {
      const remainingCount = await this.allocationsService.remove(
        this.contextOf(purchase, leg, allocation.purchaseItemId, supplier),
        allocation,
      );
      return this.legsService.removeIfUnallocated(leg, remainingCount);
    });
    return {
      success: true,
      message: isLegRemoved
        ? `Allocation removed from "${purchase.purchaseNumber}"; ${leg.supplierName} has no allocations left and was removed.`
        : `Allocation removed from "${purchase.purchaseNumber}".`,
    };
  }

  // Returns the supplier's leg on the purchase, opening it with its active enrollment at the site when there is none
  private async findOrOpenLeg(purchase: PurchaseRow, supplierId: string): Promise<PurchaseSupplier> {
    const leg = await this.legsService.findForSupplier(purchase.id, supplierId);
    if (leg) return leg;
    const snapshot = await this.supplierEnrollmentsService.findPurchasingSnapshot(supplierId, purchase.siteId);
    return this.legsService.open(purchase, supplierId, snapshot);
  }

  // Gathers what an allocation change is checked against: the purchase, the leg and whether its invoice prices it, the
  // purchase item and the supplier's currencies
  private contextOf(
    purchase: PurchaseRow,
    leg: PurchaseSupplier,
    purchaseItemId: string,
    supplier: Supplier,
  ): AllocationContext {
    return {
      purchase,
      leg: { ...leg, allowsUnpriced: this.legsService.allowsUnpriced(leg.type) },
      purchaseItemId,
      supplierCurrencies: supplier.currencyCodes,
    };
  }
}
