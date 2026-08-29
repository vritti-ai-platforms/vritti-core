import type { SupplierItemsSelectQueryDto } from '@commerce/supplier-items/dto/request/supplier-items-select-query.dto';
import { Injectable, Logger } from '@nestjs/common';
import type { SelectQueryResult } from '@vritti/api-sdk/database';
import { NatsClientService } from '@vritti/api-sdk/nats';

@Injectable()
export class SupplierItemsGatewayService {
  private readonly logger = new Logger(SupplierItemsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Returns supplier items as selectable dropdown options
  async findForSelect(query: SupplierItemsSelectQueryDto): Promise<SelectQueryResult> {
    this.logger.log(`le.supplierItems.select — supplierId: ${query.supplierId ?? 'all'}`);
    return this.nats.send('commerce', 'le.supplierItems.select', query);
  }
}
