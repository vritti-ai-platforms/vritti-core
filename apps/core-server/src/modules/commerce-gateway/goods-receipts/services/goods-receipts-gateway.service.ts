import { Injectable, Logger } from '@nestjs/common';
import { NatsClientService } from '@vritti/api-sdk';
import type { CreateGoodsReceiptDto } from '../dto/request/create-goods-receipt.dto';

@Injectable()
export class GoodsReceiptsGatewayService {
  private readonly logger = new Logger(GoodsReceiptsGatewayService.name);

  constructor(private readonly nats: NatsClientService) {}

  // Creates a new goods receipt for a purchase order
  async create(dto: CreateGoodsReceiptDto): Promise<unknown> {
    this.logger.log(`goodsReceipts.create — poId: ${dto.purchaseOrderId}`);
    return this.nats.send('commerce', 'goodsReceipts.create', dto);
  }

  // Returns goods receipts for a given purchase order
  async findByPoId(poId: string): Promise<unknown> {
    this.logger.log(`goodsReceipts.findByPoId — poId: ${poId}`);
    return this.nats.send('commerce', 'goodsReceipts.findByPoId', { poId });
  }
}
