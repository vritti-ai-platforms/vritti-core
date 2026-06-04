import { SupplierItemsService } from '@domain/supplier-items/services/supplier-items.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk';

@Controller()
export class SupplierItemsController {
  private readonly logger = new Logger(SupplierItemsController.name);

  constructor(private readonly service: SupplierItemsService) {}

  @MessagePattern({ cmd: 'supplierItems.select' })
  async select(
    @Payload()
    data: SelectOptionsQueryDto & {
      supplierId?: string;
      excludeOnPurchaseOrderId?: string;
      excludeOnGoodsReceiptId?: string;
    },
  ): Promise<SelectQueryResult> {
    const { supplierId, excludeOnPurchaseOrderId, excludeOnGoodsReceiptId, ...query } = data;
    this.logger.log(`supplierItems.select — supplierId: ${supplierId ?? 'all'}`);
    return this.service.findForSelect(query, {
      supplierId,
      excludeOnPurchaseOrderId,
      excludeOnGoodsReceiptId,
    });
  }
}
