import type { InboundDeliveryLineResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-line-response.dto';
import type { InboundDeliveryLineTableResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-line-table-response.dto';
import type { InboundDeliveryResponseDto } from '@commerce/inbound-deliveries/dto/response/inbound-delivery-response.dto';
import type { LeInboundDeliveryResponseDto } from '@commerce/inbound-deliveries/dto/response/le-inbound-delivery-response.dto';
import type { LeInboundDeliveryTableResponseDto } from '@commerce/inbound-deliveries/dto/response/le-inbound-delivery-table-response.dto';
import { Injectable, Logger } from '@nestjs/common';
import { TableStateService } from '@vritti/api-sdk/data-table';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { OwnerNameService } from '@/owner-names/owner-name.service';

@Injectable()
export class LeInboundDeliveriesGatewayService {
  private readonly logger = new Logger(LeInboundDeliveriesGatewayService.name);

  constructor(
    private readonly nats: NatsClientService,
    private readonly tableStateService: TableStateService,
    private readonly ownerNames: OwnerNameService,
  ) {}

  // Returns the inbound deliveries of the legal entity's sites with site names
  async findForTable(userId: string, orgId: string): Promise<LeInboundDeliveryTableResponseDto> {
    this.logger.log('le.inboundDeliveries.table');
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      'commerce-le-inbound-deliveries',
    );
    const { result, count } = await this.nats.send<{ result: InboundDeliveryResponseDto[]; count: number }>(
      'commerce',
      'le.inboundDeliveries.table',
      state,
    );
    return { result: await this.ownerNames.withSiteNames(orgId, result), count, state, activeViewId };
  }

  // Returns one inbound delivery with its site named
  async findById(id: string, orgId: string): Promise<LeInboundDeliveryResponseDto> {
    this.logger.log(`le.inboundDeliveries.findById — id: ${id}`);
    const delivery = await this.nats.send<InboundDeliveryResponseDto>('commerce', 'le.inboundDeliveries.findById', {
      id,
    });
    const [named] = await this.ownerNames.withSiteNames(orgId, [delivery]);
    return named;
  }

  // Returns an inbound delivery's lines for the data table with server-stored state
  async findLinesTable(inboundDeliveryId: string, userId: string): Promise<InboundDeliveryLineTableResponseDto> {
    this.logger.log(`le.inboundDeliveries.lines.table — inboundDeliveryId: ${inboundDeliveryId}`);
    const { state, activeViewId } = await this.tableStateService.getTableState(
      userId,
      `commerce-le-inbound-delivery-${inboundDeliveryId}-lines`,
    );
    const { result, count } = await this.nats.send<{ result: InboundDeliveryLineResponseDto[]; count: number }>(
      'commerce',
      'le.inboundDeliveries.lines.table',
      { inboundDeliveryId, ...state },
    );
    return { result, count, state, activeViewId };
  }
}
