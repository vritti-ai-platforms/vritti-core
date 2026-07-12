import { InventoryItemSerialsService } from '@domain/inventory-item-serials/services/inventory-item-serials.service';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SelectOptionsQueryDto, SelectQueryResult } from '@vritti/api-sdk/database';

@Controller()
export class InventoryItemsSerialsController {
  private readonly logger = new Logger(InventoryItemsSerialsController.name);

  constructor(private readonly service: InventoryItemSerialsService) {}

  // Returns paginated AVAILABLE serials, optionally filtered to a specific inventory quant
  @MessagePattern({ cmd: 'site.inventoryItems.selectSerials' })
  async select(@Payload() data: SelectOptionsQueryDto & { quantId?: string }): Promise<SelectQueryResult> {
    this.logger.log(`inventoryItems.selectSerials — quantId: ${data.quantId ?? 'all'}`);
    return this.service.findForSelect(data);
  }
}
