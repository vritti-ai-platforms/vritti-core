import { Injectable, Logger } from '@nestjs/common';
import {
  type CreateResponseDto,
  type FieldMap,
  FilterProcessor,
  type SelectOptionsQueryDto,
  type SelectQueryResult,
  type SuccessResponseDto,
  type TableViewState,
} from '@vritti/api-sdk/database';
import { and, desc, inArray } from '@vritti/api-sdk/drizzle-orm';
import { BadRequestException, NotFoundException, ValidationException } from '@vritti/api-sdk/exceptions';
import {
  type ExchangeRateType,
  ExchangeRateTypeValues,
  type PurchaseOrderStatus,
  PurchaseOrderStatusValues,
  purchaseOrders,
  suppliers,
} from '@/db/schema';
import type { CreatePurchaseOrderDto } from '@/modules/purchase-orders/dto/request/create-purchase-order.dto';
import { PurchaseOrderDto } from '../dto/entity/purchase-order.dto';
import { PurchaseOrdersRepository } from '../repositories/purchase-orders.repository';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  private static readonly SEARCH_FIELD_MAP: FieldMap = {
    poNumber: { column: purchaseOrders.poNumber, type: 'string' },
    supplierName: { column: suppliers.name, type: 'string' },
  };
  private static readonly FILTER_FIELD_MAP: FieldMap = {
    status: { column: purchaseOrders.status, type: 'string' },
    supplierId: { column: purchaseOrders.supplierId, type: 'string' },
  };

  private static readonly STATUS_TRANSITIONS: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
    [PurchaseOrderStatusValues.DRAFT]: [PurchaseOrderStatusValues.SENT, PurchaseOrderStatusValues.CANCELLED],
    [PurchaseOrderStatusValues.SENT]: [
      PurchaseOrderStatusValues.CONFIRMED,
      PurchaseOrderStatusValues.PARTIALLY_RECEIVED,
      PurchaseOrderStatusValues.RECEIVED,
      PurchaseOrderStatusValues.CANCELLED,
    ],
    [PurchaseOrderStatusValues.CONFIRMED]: [
      PurchaseOrderStatusValues.PARTIALLY_RECEIVED,
      PurchaseOrderStatusValues.RECEIVED,
      PurchaseOrderStatusValues.CLOSED,
      PurchaseOrderStatusValues.CANCELLED,
    ],
    [PurchaseOrderStatusValues.PARTIALLY_RECEIVED]: [
      PurchaseOrderStatusValues.RECEIVED,
      PurchaseOrderStatusValues.CLOSED,
    ],
    [PurchaseOrderStatusValues.RECEIVED]: [],
    [PurchaseOrderStatusValues.CLOSED]: [],
    [PurchaseOrderStatusValues.CANCELLED]: [],
    // Reserved for upcoming approval workflow — no transitions wired yet.
    [PurchaseOrderStatusValues.PENDING_APPROVAL]: [],
    [PurchaseOrderStatusValues.APPROVED]: [],
    [PurchaseOrderStatusValues.REJECTED]: [],
  };

  constructor(private readonly repository: PurchaseOrdersRepository) {}

  // Returns paginated purchase order options for select dropdowns
  findForSelect(query: SelectOptionsQueryDto): Promise<SelectQueryResult> {
    const { status, supplierId } = query as SelectOptionsQueryDto & { status?: string; supplierId?: string };
    const where: Record<string, string> = {};
    if (supplierId) where.supplierId = supplierId;

    const statusList = status
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const conditions =
      statusList && statusList.length > 0
        ? [inArray(purchaseOrders.status, statusList as PurchaseOrderStatus[])]
        : undefined;

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
      where: Object.keys(where).length > 0 ? where : undefined,
      conditions,
      orderByKey: query.orderByKey || 'poNumber',
      orderDirection: query.orderDirection || 'desc',
    });
  }

  // Returns paginated POs for the data table
  async findForTable(state: TableViewState): Promise<{ result: PurchaseOrderDto[]; count: number }> {
    const filterWhere = FilterProcessor.buildWhere(state.filters, PurchaseOrdersService.FILTER_FIELD_MAP);
    const searchWhere = FilterProcessor.buildSearch(state.search, PurchaseOrdersService.SEARCH_FIELD_MAP);
    const where = and(filterWhere, searchWhere);
    const orderBy = FilterProcessor.buildOrderBy(state.sort, {
      ...PurchaseOrdersService.SEARCH_FIELD_MAP,
      ...PurchaseOrdersService.FILTER_FIELD_MAP,
      orderDate: { column: purchaseOrders.orderDate, type: 'string' },
    });
    const { limit = 20, offset = 0 } = state.pagination;

    const { result: rows, count } = await this.repository.findForTable({
      where: where || undefined,
      orderBy: orderBy.length > 0 ? orderBy : [desc(purchaseOrders.createdAt)],
      limit,
      offset,
    });

    return {
      result: rows.map((entity) => PurchaseOrderDto.from(entity, entity.supplierName)),
      count,
    };
  }

  // Creates a new PO. App-layer resolves the supplier and site currency snapshots.
  async create(
    data: CreatePurchaseOrderDto,
    supplierCurrencyCode: string,
    siteCurrencyCode: string,
  ): Promise<CreateResponseDto<PurchaseOrderDto>> {
    const isSameCurrency = supplierCurrencyCode === siteCurrencyCode;
    const requestedType = data.exchangeRateType ?? ExchangeRateTypeValues.FIXED;
    const exchangeRateType = isSameCurrency ? ExchangeRateTypeValues.FIXED : requestedType;

    let exchangeRate: number | null;
    if (isSameCurrency) {
      exchangeRate = 1;
    } else if (exchangeRateType === ExchangeRateTypeValues.FIXED) {
      if (data.exchangeRate == null || data.exchangeRate <= 0) {
        throw new ValidationException({
          detail: `Exchange rate is required and must be greater than 0 when supplier currency (${supplierCurrencyCode}) differs from site currency (${siteCurrencyCode}) and rate type is FIXED.`,
          errors: [{ field: 'exchangeRate', message: 'Exchange rate must be greater than 0.' }],
        });
      }
      exchangeRate = data.exchangeRate;
    } else {
      exchangeRate = null;
    }

    const poNumber = await this.repository.generatePoNumber();
    const entity = await this.repository.create({
      supplierId: data.supplierId,
      poNumber,
      currencyCode: supplierCurrencyCode,
      exchangeRate,
      exchangeRateType,
      orderDate: data.orderDate,
      expectedBy: data.expectedBy ?? null,
      notes: data.notes ?? null,
    });

    const detailed = await this.repository.findByIdWithSupplierName(entity.id);
    if (!detailed) throw new NotFoundException('Purchase order not found.');

    this.logger.log(`Created PO: ${entity.poNumber}`);
    return {
      success: true,
      message: `Purchase order "${entity.poNumber}" created successfully.`,
      data: PurchaseOrderDto.from(detailed, detailed.supplierName),
    };
  }

  // Returns PO header without line items
  async findById(id: string): Promise<PurchaseOrderDto> {
    const entity = await this.repository.findByIdWithSupplierName(id);
    if (!entity) throw new NotFoundException('Purchase order not found.');
    return PurchaseOrderDto.from(entity, entity.supplierName);
  }

  // Updates notes on a purchase order
  async updateNotes(id: string, notes: string | null): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    const entity = await this.repository.update(id, { notes: notes ?? null });
    this.logger.log(`Updated PO notes: ${entity.poNumber} (${entity.id})`);
    return { success: true, message: `Notes updated for purchase order "${entity.poNumber}".` };
  }

  // Changes supplier on a draft PO. Items-empty check is the app-layer's responsibility.
  async changeSupplier(id: string, supplierId: string, supplierName: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    if (existing.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({
        label: 'Cannot Change Supplier',
        detail: 'Supplier can only be changed while the purchase order is in draft.',
      });
    }

    const entity = await this.repository.update(id, { supplierId });
    this.logger.log(`Changed PO supplier: ${entity.poNumber} (${entity.id})`);
    return {
      success: true,
      message: `Supplier changed to "${supplierName}" for purchase order "${entity.poNumber}".`,
    };
  }

  // Transitions PO status
  async updateStatus(id: string, status: PurchaseOrderStatus): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    const allowedNext = PurchaseOrdersService.STATUS_TRANSITIONS[existing.status] ?? [];
    if (!allowedNext.includes(status)) {
      throw new BadRequestException(`Cannot transition purchase order status from ${existing.status} to ${status}.`);
    }
    if (status === PurchaseOrderStatusValues.SENT && Number(existing.totalAmount ?? 0) <= 0) {
      throw new BadRequestException({
        label: 'Cannot Mark as Sent',
        detail: 'Purchase order total amount must be greater than 0 before marking it as sent.',
      });
    }
    const entity = await this.repository.update(id, { status });
    this.logger.log(`PO ${entity.poNumber} status → ${status}`);
    return { success: true, message: `Purchase order "${entity.poNumber}" status updated to ${status}.` };
  }

  // Closes a PO short — no further receipts expected; quantities already received are kept.
  async closeShort(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');

    const canClose =
      existing.status === PurchaseOrderStatusValues.CONFIRMED ||
      existing.status === PurchaseOrderStatusValues.PARTIALLY_RECEIVED;
    if (!canClose) {
      throw new BadRequestException({
        label: 'Cannot Close',
        detail: 'Only confirmed or partially-received purchase orders can be closed.',
      });
    }

    const entity = await this.repository.update(id, { status: PurchaseOrderStatusValues.CLOSED });
    this.logger.log(`Closed PO short: ${entity.poNumber} (${entity.id})`);
    return { success: true, message: `Purchase order "${entity.poNumber}" closed.` };
  }

  // Changes the exchange rate type and/or rate on a pre-receipt PO
  async changeExchangeRate(
    id: string,
    data: { exchangeRateType: ExchangeRateType; exchangeRate?: number | null },
    supplierCurrencyCode: string,
    siteCurrencyCode: string,
  ): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');

    const isPreReceipt =
      existing.status === PurchaseOrderStatusValues.DRAFT ||
      existing.status === PurchaseOrderStatusValues.SENT ||
      existing.status === PurchaseOrderStatusValues.CONFIRMED;
    if (!isPreReceipt) {
      throw new BadRequestException({
        label: 'Cannot Change Exchange Rate',
        detail: 'Exchange rate is locked once a goods receipt has been posted.',
      });
    }

    if (supplierCurrencyCode === siteCurrencyCode) {
      throw new BadRequestException({
        label: 'Cannot Change Exchange Rate',
        detail: 'Rate is fixed at 1 when supplier currency matches site currency.',
      });
    }

    let exchangeRate: number | null;
    if (data.exchangeRateType === ExchangeRateTypeValues.FIXED) {
      if (data.exchangeRate == null || data.exchangeRate <= 0) {
        throw new ValidationException({
          detail: 'Exchange rate must be greater than 0 for FIXED policy.',
          errors: [{ field: 'exchangeRate', message: 'Exchange rate must be greater than 0.' }],
        });
      }
      exchangeRate = data.exchangeRate;
    } else {
      exchangeRate = null;
    }

    const entity = await this.repository.update(id, {
      exchangeRateType: data.exchangeRateType,
      exchangeRate,
    });
    this.logger.log(
      `Changed PO exchange rate: ${entity.poNumber} (${entity.id}) → type=${data.exchangeRateType}, rate=${exchangeRate ?? 'null'}`,
    );
    return {
      success: true,
      message: `Exchange rate updated for purchase order "${entity.poNumber}".`,
    };
  }

  // Deletes a PO (only if DRAFT)
  async delete(id: string): Promise<SuccessResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException('Purchase order not found.');
    if (existing.status !== PurchaseOrderStatusValues.DRAFT) {
      throw new BadRequestException({ label: 'Cannot Delete', detail: 'Only draft purchase orders can be deleted.' });
    }
    await this.repository.delete(id);
    this.logger.log(`Deleted PO: ${existing.poNumber} (${id})`);
    return { success: true, message: `Purchase order "${existing.poNumber}" deleted successfully.` };
  }
}
