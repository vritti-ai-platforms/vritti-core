import { Injectable, Logger } from '@nestjs/common';
import { type FieldMap, FilterProcessor } from '@vritti/api-sdk/conditions';
import { type TableState } from '@vritti/api-sdk/data-table';
import Decimal from '@vritti/api-sdk/decimal';
import { and, desc, inArray } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException } from '@vritti/api-sdk/exceptions';
import type { CreateResponseDto, SuccessResponseDto } from '@vritti/api-sdk/responses';
import { type SelectOptionsQueryDto, type SelectQueryResult } from '@vritti/api-sdk/select';
import { type PurchaseOrderStatus, PurchaseOrderStatusValues, parties, purchaseOrders } from '@/db/schema';
import { PurchaseOrderDto } from '../dto/entity/purchase-order.dto';
import type { ChangePurchaseOrderExchangeRateDto } from '../dto/request/change-purchase-order-exchange-rate.dto';
import type { CreatePurchaseOrderDto } from '../dto/request/create-purchase-order.dto';
import type { UpdatePurchaseOrderNotesDto } from '../dto/request/update-purchase-order-notes.dto';
import type { UpdatePurchaseOrderStatusDto } from '../dto/request/update-purchase-order-status.dto';
import { type PurchaseOrderRow, PurchaseOrdersDomainRepository } from '../repositories/purchase-orders.repository';

export interface PurchaseOrderCreateContext {
  siteId: string;
  timezone: string;
  currencyCode: string;
  leCurrencyCode: string;
}

export interface PurchaseOrderSupplier {
  id: string;
  name: string;
  currencyCode: string;
  currencyCodes: string[];
}

@Injectable()
export class PurchaseOrdersDomainService {
  private readonly logger = new Logger(PurchaseOrdersDomainService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    poNumber: { column: purchaseOrders.poNumber, type: 'string' },
    supplierName: { column: parties.displayName, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    status: { column: purchaseOrders.status, type: 'string' },
    supplierId: { column: purchaseOrders.supplierId, type: 'string' },
    siteId: { column: purchaseOrders.siteId, type: 'string' },
    sites: { column: purchaseOrders.siteId, type: 'string' },
  };
  private static readonly SORT_FIELD_MAP: FieldMap = {
    ...PurchaseOrdersDomainService.SEARCH_FIELD_MAP,
    ...PurchaseOrdersDomainService.FILTER_FIELD_MAP,
    orderDate: { column: purchaseOrders.orderDate, type: 'string' },
    taxDate: { column: purchaseOrders.taxDate, type: 'string' },
  };

  private static readonly STATUS_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
    [PurchaseOrderStatusValues.DRAFT]: [PurchaseOrderStatusValues.SENT, PurchaseOrderStatusValues.CANCELLED],
    [PurchaseOrderStatusValues.SENT]: [PurchaseOrderStatusValues.CONFIRMED, PurchaseOrderStatusValues.CANCELLED],
    [PurchaseOrderStatusValues.CONFIRMED]: [PurchaseOrderStatusValues.CLOSED, PurchaseOrderStatusValues.CANCELLED],
    [PurchaseOrderStatusValues.PARTIALLY_RECEIVED]: [PurchaseOrderStatusValues.CLOSED],
    [PurchaseOrderStatusValues.RECEIVED]: [],
    [PurchaseOrderStatusValues.CLOSED]: [],
    [PurchaseOrderStatusValues.CANCELLED]: [],
    [PurchaseOrderStatusValues.PENDING_APPROVAL]: [],
    [PurchaseOrderStatusValues.APPROVED]: [],
    [PurchaseOrderStatusValues.REJECTED]: [],
  };

  constructor(private readonly repository: PurchaseOrdersDomainRepository) {}

  // Returns paginated purchase order options for select dropdowns, optionally narrowed to statuses and a supplier
  findForSelect(query: SelectOptionsQueryDto & { status?: string; supplierId?: string }): Promise<SelectQueryResult> {
    const statuses = (query.status ?? '')
      .split(',')
      .map((status) => status.trim())
      .filter((status): status is PurchaseOrderStatus => status in PurchaseOrderStatusValues);

    return this.repository.findForSelect({
      value: query.valueKey || 'id',
      label: query.labelKey || 'poNumber',
      description: query.descriptionKey,
      additionalKeys: query.additionalKeys,
      groupIdKey: query.groupIdKey,
      search: query.search,
      limit: query.limit,
      offset: query.offset,
      values: query.values,
      excludeIds: query.excludeIds,
      where: query.supplierId ? { supplierId: query.supplierId } : undefined,
      conditions: statuses.length > 0 ? [inArray(purchaseOrders.status, statuses)] : undefined,
      orderByKey: query.orderByKey || 'poNumber',
      orderDirection: query.orderDirection || 'desc',
    });
  }

  // Returns one page of purchase orders
  async findForTable(state: TableState): Promise<{ result: PurchaseOrderDto[]; count: number }> {
    const orderBy = FilterProcessor.buildOrderBy(state.sort, PurchaseOrdersDomainService.SORT_FIELD_MAP);
    const { limit = 20, offset = 0 } = state.pagination;

    const { result, count } = await this.repository.findForTable({
      where: and(
        FilterProcessor.buildWhere(state.filters, PurchaseOrdersDomainService.FILTER_FIELD_MAP),
        FilterProcessor.buildSearch(state.search, PurchaseOrdersDomainService.SEARCH_FIELD_MAP),
      ),
      orderBy: orderBy.length > 0 ? orderBy : [desc(purchaseOrders.createdAt)],
      limit,
      offset,
    });
    return { result: result.map(PurchaseOrderDto.from), count };
  }

  // Returns one purchase order header
  async findById(id: string): Promise<PurchaseOrderDto> {
    return PurchaseOrderDto.from(await this.repository.findDetailOrThrow(id));
  }

  // Creates a draft PO at the given site, storing an exchange rate only when its currency is not the legal entity's
  async create(
    dto: CreatePurchaseOrderDto,
    context: PurchaseOrderCreateContext,
  ): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const exchangeRate = this.repository.resolveExchangeRateOrThrow(
      context.currencyCode,
      context.leCurrencyCode,
      dto.exchangeRate,
    );
    const poNumber = await this.repository.generatePoNumber();
    const created = await this.repository.create({
      siteId: context.siteId,
      timezone: context.timezone,
      supplierId: dto.supplierId,
      poNumber,
      currencyCode: context.currencyCode,
      exchangeRate,
      orderDate: dto.orderDate,
      taxDate: dto.taxDate,
      notes: dto.notes ?? null,
    });

    this.logger.log(`Created PO ${poNumber} at site ${context.siteId}`);
    return {
      success: true,
      message: `Purchase order "${poNumber}" created successfully.`,
      data: await this.findById(created.id),
    };
  }

  // Updates the notes on a purchase order
  async updateNotes(dto: UpdatePurchaseOrderNotesDto): Promise<SuccessResponseDto> {
    const po = await this.repository.findDetailOrThrow(dto.id);
    await this.repository.update(po.id, { notes: dto.notes ?? null });
    this.logger.log(`Updated PO ${po.poNumber} notes`);
    return { success: true, message: `Notes updated for purchase order "${po.poNumber}".` };
  }

  // Sets the tax date of a PO whose lines are still editable; the caller moves the lines that follow it
  async updateTaxDate(po: PurchaseOrderRow, taxDate: string): Promise<void> {
    this.repository.assertTaxDateEditable(po);
    await this.repository.update(po.id, { taxDate });
    this.logger.log(`Updated PO ${po.poNumber} tax date to ${taxDate}`);
  }

  // Moves a draft PO to another supplier, switching to its default currency when it does not trade in the PO's
  async changeSupplier(
    po: PurchaseOrderRow,
    supplier: PurchaseOrderSupplier,
    leCurrencyCode: string,
    exchangeRate: number | undefined,
  ): Promise<SuccessResponseDto> {
    this.repository.assertSupplierChangeable(po);

    const keepsCurrency = supplier.currencyCodes.includes(po.currencyCode);
    const currencyCode = keepsCurrency ? po.currencyCode : supplier.currencyCode;
    await this.repository.update(po.id, {
      supplierId: supplier.id,
      conversionRates: {},
      currencyCode,
      exchangeRate: keepsCurrency
        ? po.exchangeRate
        : this.repository.resolveExchangeRateOrThrow(currencyCode, leCurrencyCode, exchangeRate),
    });

    this.logger.log(`Changed PO ${po.poNumber} supplier to ${supplier.id}`);
    return { success: true, message: `Supplier changed to "${supplier.name}" for purchase order "${po.poNumber}".` };
  }

  // Changes the rate into the legal entity's currency of a foreign-currency PO until a receipt of it is published
  async changeExchangeRate(
    dto: ChangePurchaseOrderExchangeRateDto,
    leCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    const po = await this.repository.findDetailOrThrow(dto.id);
    this.repository.assertPricingUnlocked(po, 'Cannot Change Exchange Rate');
    if (po.currencyCode === leCurrencyCode) {
      throw new BadRequestException({
        label: 'Cannot Change Exchange Rate',
        detail: `"${po.poNumber}" is in ${leCurrencyCode}, the legal entity's currency, so its rate is always 1.`,
      });
    }

    await this.repository.update(po.id, { exchangeRate: dto.exchangeRate });
    this.logger.log(`Changed PO ${po.poNumber} exchange rate to ${dto.exchangeRate}`);
    return { success: true, message: `Exchange rate updated for purchase order "${po.poNumber}".` };
  }

  // Records 1 unit of another supplier currency in the PO currency; the caller converts its lines and syncs the total
  async setConversionRate(po: PurchaseOrderRow, currencyCode: string, rate: number): Promise<string> {
    this.repository.assertPricingUnlocked(po, 'Cannot Change Conversion Rate');
    if (currencyCode === po.currencyCode) {
      throw new BadRequestException({
        label: 'Same Currency',
        detail: `The purchase order is already in ${currencyCode}.`,
        errors: [{ field: 'currencyCode', message: 'Same as the PO currency' }],
      });
    }
    const stored = new Decimal(rate).toFixed(6);
    await this.repository.update(po.id, { conversionRates: { ...po.conversionRates, [currencyCode]: stored } });
    this.logger.log(`Set PO ${po.poNumber} rate 1 ${currencyCode} = ${stored} ${po.currencyCode}`);
    return stored;
  }

  // Moves a PO along its manual workflow (send, confirm, close, cancel)
  async updateStatus(dto: UpdatePurchaseOrderStatusDto): Promise<SuccessResponseDto> {
    const po = await this.repository.findDetailOrThrow(dto.id);
    const allowedNext = PurchaseOrdersDomainService.STATUS_TRANSITIONS[po.status];
    if (!allowedNext.includes(dto.status)) {
      throw new BadRequestException({
        label: 'Cannot Change Status',
        detail: `A ${po.status} purchase order cannot move to ${dto.status}.`,
      });
    }
    if (dto.status === PurchaseOrderStatusValues.SENT && po.totalAmount <= 0n) {
      throw new BadRequestException({
        label: 'Cannot Mark as Sent',
        detail: 'Add priced line items before marking the purchase order as sent.',
      });
    }
    await this.repository.update(po.id, { status: dto.status });
    this.logger.log(`PO ${po.poNumber} status → ${dto.status}`);
    return { success: true, message: `Purchase order "${po.poNumber}" status updated to ${dto.status}.` };
  }

  // Closes a PO short — no further receipts expected; quantities already received are kept
  async closeShort(id: string): Promise<SuccessResponseDto> {
    const po = await this.repository.findDetailOrThrow(id);
    if (!this.repository.isReceivable(po)) {
      throw new BadRequestException({
        label: 'Cannot Close',
        detail: 'Only confirmed or partially received purchase orders can be closed.',
      });
    }
    await this.repository.update(po.id, { status: PurchaseOrderStatusValues.CLOSED });
    this.logger.log(`Closed PO ${po.poNumber} short`);
    return { success: true, message: `Purchase order "${po.poNumber}" closed.` };
  }

  // Moves each receivable PO a published receipt counts to received or partially received from its lines
  async syncReceiptStatusesForReceipt(goodsReceiptId: string): Promise<void> {
    const moved = await this.repository.syncReceiptStatusesForReceipt(goodsReceiptId);
    for (const po of moved) this.logger.log(`PO ${po.poNumber} status → ${po.status} from its published receipts`);
  }

  // Deletes a draft purchase order
  async delete(id: string): Promise<SuccessResponseDto> {
    const po = await this.repository.findDetailOrThrow(id);
    if (po.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({ label: 'Cannot Delete', detail: 'Only draft purchase orders can be deleted.' });
    }
    await this.repository.delete(po.id);
    this.logger.log(`Deleted PO ${po.poNumber} (${po.id})`);
    return { success: true, message: `Purchase order "${po.poNumber}" deleted successfully.` };
  }
}
