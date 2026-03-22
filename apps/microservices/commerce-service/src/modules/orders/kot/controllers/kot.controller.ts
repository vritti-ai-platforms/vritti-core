import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { SuccessResponseDto } from '@vritti/api-sdk';
import type { KotItemDto } from '../dto/entity/kot-item.dto';
import { KotService } from '../services/kot.service';

@Controller()
export class KotController {
  constructor(private readonly kotService: KotService) {}

  // Finds active KOT items for an org+bu
  @MessagePattern('commerce.kot.findActive')
  findActive(@Payload() data: { organizationId: string; businessUnitId: string }): Promise<KotItemDto[]> {
    return this.kotService.findActive(data.organizationId, data.businessUnitId);
  }

  // Updates a KOT item's status
  @MessagePattern('commerce.kot.updateItemStatus')
  updateItemStatus(@Payload() data: { itemId: string; status: string }): Promise<SuccessResponseDto> {
    return this.kotService.updateItemStatus(data.itemId, data.status);
  }
}
