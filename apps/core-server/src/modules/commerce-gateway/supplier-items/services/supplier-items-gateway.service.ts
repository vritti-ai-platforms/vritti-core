import { Injectable, Logger } from '@nestjs/common';
import type { SelectQueryResult } from '@vritti/api-sdk';
import { NatsClientService } from '@vritti/api-sdk/nats';
import type { SupplierItemsSelectQueryDto } from '../dto/request/supplier-items-select-query.dto';

@Injectable()
export class SupplierItemsGatewayService {
  private readonly logger = new Logger(SupplierItemsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns paginated supplier item options. When supplierId is absent, includes the supplier name as
  // each option's description. When purchaseOrderId is provided, the option `additionals` carries the
  // negotiated PO line price for pre-fill on the GR add-item flow.
  async select(query: SupplierItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`supplierItems.select — supplierId: ${query.supplierId ?? 'all'}`);
    return this.nats.send('commerce', 'supplierItems.select', query);
  }
}
