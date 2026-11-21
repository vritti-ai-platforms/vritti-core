import { RequestPurchaseQuotationDto } from '@domain/purchases/dto/request/request-purchase-quotation.dto';
import type { PurchaseQuotationTableRowDto } from '@domain/supplier-quotations/dto/entity/purchase-quotation.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';
import type { PurchaseItemQuoteRowDto } from '@/modules/site/purchases/items/root/dto/entity/purchase-item-quote.dto';
import { PurchasesQuotationsService } from '@/modules/site/purchases/quotations/services/purchases-quotations.service';

@Controller()
export class LePurchasesQuotationsController {
  private readonly logger = new Logger(LePurchasesQuotationsController.name);

  constructor(private readonly service: PurchasesQuotationsService) {}

  // Creates a draft quotation the purchase's site owns, from a supplier, for the items still to allocate
  @MessagePattern({ cmd: 'le.purchases.quotations.request' })
  request(@Payload() dto: RequestPurchaseQuotationDto): Promise<CreateResponseDto<{ quotationId: string }>> {
    this.logger.log(`le.purchases.quotations.request — id: ${dto.id}, supplier: ${dto.supplierId}`);
    return this.service.request(dto);
  }

  // Returns one page of the quotations linked to a purchase, without their lines
  @MessagePattern({ cmd: 'le.purchases.quotations.table' })
  table(
    @Payload() data: { id: string } & TableState,
  ): Promise<{ result: PurchaseQuotationTableRowDto[]; count: number }> {
    const { id, ...state } = data;
    this.logger.log(`le.purchases.quotations.table — id: ${id}`);
    return this.service.findForTable(id, state);
  }

  // Returns one page of the quotation lines quoting a purchase item, priced per primary unit, the cheapest marked
  @MessagePattern({ cmd: 'le.purchases.quotations.itemTable' })
  itemTable(
    @Payload() data: { id: string; itemId: string } & TableState,
  ): Promise<{ result: PurchaseItemQuoteRowDto[]; count: number }> {
    const { id, itemId, ...state } = data;
    this.logger.log(`le.purchases.quotations.itemTable — id: ${id}, item: ${itemId}`);
    return this.service.findItemQuotesTable(id, itemId, state);
  }
}
