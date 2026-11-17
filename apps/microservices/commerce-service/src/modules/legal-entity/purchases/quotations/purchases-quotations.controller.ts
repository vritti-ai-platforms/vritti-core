import { RequestPurchaseQuotationDto } from '@domain/purchases/dto/request/request-purchase-quotation.dto';
import type { PurchaseQuotationTableRowDto } from '@domain/supplier-quotations/dto/entity/purchase-quotation.dto';
import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { TableState } from '@vritti/api-sdk/data-table';
import type { CreateResponseDto } from '@vritti/api-sdk/responses';
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
}
