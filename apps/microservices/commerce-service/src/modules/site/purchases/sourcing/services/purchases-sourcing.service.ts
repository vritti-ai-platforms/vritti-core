import { PurchaseItemAllocationsDomainService } from '@domain/purchase-item-allocations/services/purchase-item-allocations.service';
import { PurchaseItemsDomainService } from '@domain/purchase-items/services/purchase-items.service';
import { PurchaseSuppliersDomainService } from '@domain/purchase-suppliers/services/purchase-suppliers.service';
import { PurchasesDomainService } from '@domain/purchases/services/purchases.service';
import { Injectable } from '@nestjs/common';
import _ from '@vritti/api-sdk/lodash';
import { PurchaseSourcingAllocationDto, PurchaseSourcingItemDto } from '../dto/entity/purchase-sourcing-item.dto';

@Injectable()
export class PurchasesSourcingService {
  constructor(
    private readonly purchasesService: PurchasesDomainService,
    private readonly itemsService: PurchaseItemsDomainService,
    private readonly legsService: PurchaseSuppliersDomainService,
    private readonly allocationsService: PurchaseItemAllocationsDomainService,
  ) {}

  // Returns the items of a purchase in reach, each with its allocations across every leg, the supplier and state of the
  // leg each belongs to and whether it may still change
  async findItems(id: string): Promise<PurchaseSourcingItemDto[]> {
    const purchase = await this.purchasesService.findDetailOrThrow(id);
    const [items, allocations, legs] = await Promise.all([
      this.itemsService.findByPurchaseId(purchase.id),
      this.allocationsService.findByPurchaseId(purchase.id),
      this.legsService.findByPurchaseId(purchase.id),
    ]);
    const legsById = _.keyBy(legs, 'id');
    const allocationsByItem = _.groupBy(
      allocations.map((allocation) => {
        const leg = legsById[allocation.purchaseSupplierId];
        return PurchaseSourcingAllocationDto.fromAllocation(
          allocation,
          leg,
          this.allocationsService.isEditable(purchase, leg),
        );
      }),
      'purchaseItemId',
    );
    return items.map((item) => PurchaseSourcingItemDto.fromItem(item, allocationsByItem[item.id] ?? []));
  }
}
