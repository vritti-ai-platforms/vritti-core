import type { PurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/entity/purchase-allocation.dto';
import type { CreatePurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/request/create-purchase-allocation.dto';
import type { CreatePurchaseAllocationsFromQuotationDto } from '@domain/purchase-item-allocations/dto/request/create-purchase-allocations-from-quotation.dto';
import type { UpdatePurchaseAllocationDto } from '@domain/purchase-item-allocations/dto/request/update-purchase-allocation.dto';
import {
  type AllocationContext,
  type AllocationQuantity,
  PurchaseItemAllocationsDomainService,
} from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import type { PurchaseItemRow } from '@domain/purchase-items/repositories/purchase-items.repository';
import { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import type { PurchaseRow } from '@domain/purchases/repositories/purchases.repository';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { SupplierEnrollmentsDomainService } from '@domain/supplier-enrollments/services/supplier-enrollments.service';
import { SupplierItemsDomainService } from '@domain/supplier-items/services/supplier-items.service';
import type { PurchaseQuotationItemTermsDto } from '@domain/supplier-quotations/dto/entity/purchase-quotation-item-terms.dto';
import { SupplierQuotationsDomainService } from '@domain/supplier-quotations/services/supplier-quotations.service';
import { SuppliersDomainService } from '@domain/suppliers/services/suppliers.service';
import { UomConversionsDomainService } from '@domain/uom-conversions/services/uom-conversions.service';
import { Injectable, Logger } from '@nestjs/common';
import { PrimaryDatabaseService } from '@vritti/api-sdk/database';
import _ from '@vritti/api-sdk/lodash';
import { pluralize } from '@vritti/api-sdk/pluralize';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { formatISO } from 'date-fns';
import type { PurchaseSupplier, Supplier } from '@/db/schema';

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
    private readonly purchasesService: PurchasesDomainService,
    private readonly itemsService: PurchaseItemsDomainService,
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
    private readonly suppliersService: SuppliersDomainService,
    private readonly supplierEnrollmentsService: SupplierEnrollmentsDomainService,
    private readonly supplierItemsService: SupplierItemsDomainService,
    private readonly supplierQuotationsService: SupplierQuotationsDomainService,
    private readonly uomConversionsService: UomConversionsDomainService,
  ) {}

  // Allocates part of a purchase item to a supplier that supplies it at the site, opening the supplier's leg on its first
  // allocation; not on a purchase that requires quotations
  async create(dto: CreatePurchaseAllocationDto): Promise<CreateResponseDto<PurchaseAllocationDto>> {
    const purchase = await this.purchasesService.findDetailOrThrow(dto.id);
    this.allocationsService.assertEnteredAllowed(purchase);
    const item = await this.itemsService.findOnPurchaseOrThrow(purchase.id, dto.purchaseItemId);
    const supplier = await this.suppliersService.findByIdOrThrow(dto.supplierId);
    await this.supplierItemsService.assertSuppliedAt(
      supplier.id,
      purchase.siteId,
      [item.inventoryItemId],
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

  // Allocates purchase items from posted quotation lines valid today: each line's purchase item gets the line's unit, price
  // and scheme for the requested quantity rounded up to whole units, opening its supplier's leg when needed
  async createFromQuotation(dto: CreatePurchaseAllocationsFromQuotationDto): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(dto.id);
    const terms = this.allocationsService.requireQuotedItems(
      dto.supplierQuotationItemIds,
      await this.supplierQuotationsService.findPostedItemsForPurchase(
        purchase.id,
        purchase.siteId,
        dto.supplierQuotationItemIds,
        formatISO(new Date(), { representation: 'date' }),
      ),
    );
    const lines: QuotedAllocationLine[] = [];
    for (const [supplierId, supplierTerms] of Object.entries(_.groupBy(terms, 'supplierId'))) {
      const supplier = await this.suppliersService.findByIdOrThrow(supplierId);
      await this.supplierItemsService.assertSuppliedAt(
        supplier.id,
        purchase.siteId,
        supplierTerms.map((term) => term.inventoryItemId),
        'supplierQuotationItemIds',
      );
      for (const term of supplierTerms) {
        const item = await this.itemsService.findOnPurchaseOrThrow(purchase.id, term.purchaseItemId);
        const primaryPerUnit = await this.uomConversionsService.toPrimaryUomQuantity(
          item.inventoryItemId,
          term.uomId,
          1,
        );
        lines.push({
          term,
          item,
          supplier,
          quantity: this.allocationsService.quotedQuantity(item.primaryQty, primaryPerUnit),
        });
      }
    }

    await this.database.runInTransaction(async () => {
      for (const { term, item, supplier, quantity } of lines) {
        const leg = await this.findOrOpenLeg(purchase, supplier.id);
        await this.allocationsService.createFromQuotation(
          this.contextOf(purchase, leg, item.id, supplier),
          term,
          quantity,
        );
      }
    });
    this.logger.log(`purchases.allocations.createFromQuotation — ${purchase.purchaseNumber}, lines: ${terms.length}`);
    return {
      success: true,
      message: `${pluralize('quotation line', terms.length, true)} allocated on "${purchase.purchaseNumber}".`,
    };
  }

  // Changes an allocation's unit, quantity, price or scheme while its leg is in sourcing
  async update(dto: UpdatePurchaseAllocationDto): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(dto.id);
    const allocation = await this.allocationsService.findOnPurchaseOrThrow(purchase.id, dto.allocationId);
    const leg = await this.legsService.findOnPurchaseOrThrow(purchase.id, allocation.purchaseSupplierId);
    const item = await this.itemsService.findOnPurchaseOrThrow(purchase.id, allocation.purchaseItemId);
    const supplier = await this.suppliersService.findByIdOrThrow(leg.supplierId);
    const uomId = dto.uomId ?? allocation.uomId;
    const uomQty = dto.uomQty ?? allocation.uomQty;
    const quantity: AllocationQuantity = {
      uomQty,
      primaryUomQty: await this.uomConversionsService.toPrimaryUomQuantity(item.inventoryItemId, uomId, uomQty),
    };

    await this.allocationsService.update(this.contextOf(purchase, leg, item.id, supplier), allocation, dto, quantity);
    return {
      success: true,
      message: `Allocation of "${item.inventoryItemName}" updated on "${purchase.purchaseNumber}".`,
    };
  }

  // Removes an allocation while its leg is in sourcing, removing the leg with its last allocation
  async delete(id: string, allocationId: string): Promise<SuccessResponseDto> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    const allocation = await this.allocationsService.findOnPurchaseOrThrow(purchase.id, allocationId);
    const leg = await this.legsService.findOnPurchaseOrThrow(purchase.id, allocation.purchaseSupplierId);
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
