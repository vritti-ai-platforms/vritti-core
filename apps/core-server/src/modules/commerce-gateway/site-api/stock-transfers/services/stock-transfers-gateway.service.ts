import type { CreateStockTransferDto } from '@commerce/stock-transfers/dto/request/create-stock-transfer.dto';
import type { UpdateStockTransferStatusDto } from '@commerce/stock-transfers/dto/request/update-stock-transfer-status.dto';
import type {
  StockTransferResponseDto,
  StockTransferRowResponseDto,
} from '@commerce/stock-transfers/dto/response/stock-transfer-response.dto';
import type { StockTransferTableResponseDto } from '@commerce/stock-transfers/dto/response/stock-transfer-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class StockTransfersGatewayService {
  private readonly logger = new Logger(StockTransfersGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // Creates a new stock transfer
  async create(dto: CreateStockTransferDto): Promise<StockTransferResponseDto> {
    this.logger.log(`stockTransfers.create — from: ${dto.fromSiteId}, to: ${dto.toSiteId}`);
    return this.nats.send('commerce', 'site.stockTransfers.create', dto);
  }

  // Updates the status of a stock transfer
  async updateStatus(id: string, dto: UpdateStockTransferStatusDto): Promise<{ success: boolean; message: string }> {
    this.logger.log(`stockTransfers.updateStatus — id: ${id}, status: ${dto.status}`);
    return this.nats.send('commerce', 'site.stockTransfers.updateStatus', { id, ...dto });
  }

  // Returns paginated, filtered, and sorted stock transfers for the data table
  async findForTable(userId: string, orgId: string): Promise<StockTransferTableResponseDto> {
    this.logger.log('site.stockTransfers.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(userId, 'commerce-stock-transfers');

    const { result, count } = await this.nats.send<{
      result: Omit<StockTransferRowResponseDto, 'fromSiteName' | 'toSiteName'>[];
      count: number;
    }>('commerce', 'site.stockTransfers.table', state);
    // Sites live in core, so each transfer's two sites are named here
    const siteNames = await this.ownerNames.requireSiteNames(
      orgId,
      result.flatMap((transfer) => [transfer.fromSiteId, transfer.toSiteId]),
    );
    const named = result.map((transfer) => ({
      ...transfer,
      fromSiteName: siteNames.get(transfer.fromSiteId) as string,
      toSiteName: siteNames.get(transfer.toSiteId) as string,
    }));

    return { result: named, count, state, activeViewId };
  }
}
