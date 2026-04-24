import { Injectable, Logger } from '@nestjs/common';
import { DataTableStateService, NatsClientService } from '@vritti/api-sdk';
import type { CreateGoodsReceiptDto } from '../dto/request/create-goods-receipt.dto';
import type { GoodsReceiptResponseDto } from '../dto/response/goods-receipt-response.dto';
import type { GoodsReceiptTableResponseDto } from '../dto/response/goods-receipt-table-response.dto';

@Injectable()
export class GoodsReceiptsGatewayService {
  private readonly logger = new Logger(GoodsReceiptsGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly dataTableStateService: DataTableStateService,
  ) {}

  // Creates a new goods receipt for a purchase order
  async create(dto: CreateGoodsReceiptDto): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`goodsReceipts.create — supplierId: ${dto.supplierId}, poId: ${dto.purchaseOrderId}, receivedDate: ${dto.receivedDate}, receivedBy: ${dto.receivedBy}, notes: ${dto.notes}`);
    this.logger.log(`goodsReceipts.create — full payload: ${JSON.stringify(dto)}`);
    const result = await this.nats.send<GoodsReceiptResponseDto>('commerce', 'goodsReceipts.create', dto);
    this.logger.log(`goodsReceipts.create — result: ${JSON.stringify(result)}`);
    return result;
  }

  // Returns goods receipts for a given purchase order
  async findByPoId(poId: string): Promise<GoodsReceiptResponseDto[]> {
    this.logger.log(`goodsReceipts.findByPoId — poId: ${poId}`);
    return this.nats.send('commerce', 'goodsReceipts.findByPoId', { purchaseOrderId: poId });
  }

  // Returns paginated goods receipts for table view
  async findForTable(userId: string): Promise<GoodsReceiptTableResponseDto> {
    this.logger.log('goodsReceipts.table');
    const { state, activeViewId } = await this.dataTableStateService.getCurrentState(userId, 'commerce-goods-receipts');

    const { result, count } = await this.nats.send<{ result: GoodsReceiptResponseDto[]; count: number }>(
      'commerce',
      'goodsReceipts.table',
      state,
    );

    return { result, count, state, activeViewId };
  }

  // Returns goods receipt detail by ID
  async findById(id: string): Promise<GoodsReceiptResponseDto> {
    this.logger.log(`goodsReceipts.findById — id: ${id}`);
    return this.nats.send('commerce', 'goodsReceipts.findById', { id });
  }
}
