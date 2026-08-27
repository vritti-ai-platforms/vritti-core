import { Logger } from '@nestjs/common';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { AuthType, Require } from '@vritti/api-sdk/auth';
import { NatsClientService } from '@vritti/api-sdk/nats';
import { SessionTypeValues } from '@/db/schema';
import { SelectOptionsInput } from '../_shared/graphql/select.input';
import { SelectOptions } from '../_shared/graphql/select.type';

@Resolver()
@Require(AuthType.Session, SessionTypeValues.WEB, SessionTypeValues.MOBILE)
export class SelectApiResolver {
  private readonly logger = new Logger(SelectApiResolver.name);

  constructor(private readonly nats: NatsClientService) {}

  @Query(() => SelectOptions, { name: 'categoriesOptions' })
  categoriesOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY categoriesOptions');
    return this.nats.send<SelectOptions>('commerce', 'select.categories', input ?? {});
  }

  @Query(() => SelectOptions, { name: 'customersOptions' })
  customersOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY customersOptions');
    return this.nats.send<SelectOptions>('commerce', 'select.customers', input ?? {});
  }

  @Query(() => SelectOptions, { name: 'costCategoriesOptions' })
  costCategoriesOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY costCategoriesOptions');
    return this.nats.send<SelectOptions>('commerce', 'select.costCategories', input ?? {});
  }

  @Query(() => SelectOptions, { name: 'inventoryItemSerialsOptions' })
  inventoryItemSerialsOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('quantId', { type: () => ID, nullable: true }) quantId?: string,
  ): Promise<SelectOptions> {
    this.logger.log(`QUERY inventoryItemSerialsOptions — quantId: ${quantId ?? 'all'}`);
    return this.nats.send<SelectOptions>('commerce', 'select.inventoryItemSerials', { ...input, quantId });
  }

  @Query(() => SelectOptions, { name: 'inventoryItemQuantsOptions' })
  inventoryItemQuantsOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('inventoryItemId', { type: () => ID, nullable: true }) inventoryItemId?: string,
  ): Promise<SelectOptions> {
    this.logger.log(`QUERY inventoryItemQuantsOptions — inventoryItemId: ${inventoryItemId ?? 'all'}`);
    return this.nats.send<SelectOptions>('commerce', 'select.inventoryItemQuants', { ...input, inventoryItemId });
  }

  @Query(() => SelectOptions, { name: 'inventoryItemsOptions' })
  inventoryItemsOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('excludeOnSupplierId', { type: () => ID, nullable: true }) excludeOnSupplierId?: string,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY inventoryItemsOptions');
    return this.nats.send<SelectOptions>('commerce', 'select.inventoryItems', {
      ...(input ?? {}),
      excludeOnSupplierId,
    });
  }

  @Query(() => SelectOptions, { name: 'inventoryItemLotsOptions' })
  inventoryItemLotsOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('inventoryItemId', { type: () => ID, nullable: true }) inventoryItemId?: string,
  ): Promise<SelectOptions> {
    this.logger.log(`QUERY inventoryItemLotsOptions — inventoryItemId: ${inventoryItemId ?? 'all'}`);
    return this.nats.send<SelectOptions>('commerce', 'select.inventoryItemLots', { ...input, inventoryItemId });
  }

  @Query(() => SelectOptions, { name: 'purchaseOrdersOptions' })
  purchaseOrdersOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('status', { type: () => String, nullable: true }) status?: string,
    @Args('supplierId', { type: () => ID, nullable: true }) supplierId?: string,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY purchaseOrdersOptions');
    return this.nats.send<SelectOptions>('commerce', 'select.purchaseOrders', {
      ...(input ?? {}),
      status,
      supplierId,
    });
  }

  @Query(() => SelectOptions, { name: 'purchaseOrderItemsOptions' })
  purchaseOrderItemsOptions(
    @Args('purchaseOrderId', { type: () => String }) purchaseOrderId: string,
    @Args('excludeOnGoodsReceiptId', { type: () => String, nullable: true }) excludeOnGoodsReceiptId?: string,
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY purchaseOrderItemsOptions');
    return this.nats.send<SelectOptions>('commerce', 'select.purchaseOrderItems', {
      ...(input ?? {}),
      purchaseOrderId,
      excludeOnGoodsReceiptId,
    });
  }

  @Query(() => SelectOptions, { name: 'supplierItemsOptions' })
  supplierItemsOptions(
    @Args('supplierId', { type: () => String, nullable: true }) supplierId?: string,
    @Args('excludeOnPurchaseOrderId', { type: () => String, nullable: true }) excludeOnPurchaseOrderId?: string,
    @Args('excludeOnGoodsReceiptId', { type: () => String, nullable: true }) excludeOnGoodsReceiptId?: string,
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY supplierItemsOptions');
    return this.nats.send<SelectOptions>('commerce', 'select.supplierItems', {
      ...(input ?? {}),
      supplierId,
      excludeOnPurchaseOrderId,
      excludeOnGoodsReceiptId,
    });
  }

  @Query(() => SelectOptions, { name: 'locationsOptions' })
  locationsOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('locationRoles', { type: () => String, nullable: true }) locationRoles?: string,
    @Args('inventoryItemId', { type: () => ID, nullable: true }) inventoryItemId?: string,
    @Args('excludeUsedOnGoodsReceiptItemId', { type: () => ID, nullable: true })
    excludeUsedOnGoodsReceiptItemId?: string,
    @Args('goodsReceiptLotId', { type: () => ID, nullable: true }) goodsReceiptLotId?: string,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY locationsOptions');
    return this.nats.send<SelectOptions>('commerce', 'select.locations', {
      ...(input ?? {}),
      locationRoles,
      inventoryItemId,
      excludeUsedOnGoodsReceiptItemId,
      goodsReceiptLotId,
    });
  }

  @Query(() => SelectOptions, { name: 'uomOptions' })
  uomOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
    @Args('dimensionId', { type: () => ID, nullable: true }) dimensionId?: string,
    @Args('baseOnly', { type: () => Boolean, nullable: true }) baseOnly?: boolean,
    @Args('derivedOnly', { type: () => Boolean, nullable: true }) derivedOnly?: boolean,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY uomOptions');
    return this.nats.send<SelectOptions>('commerce', 'select.uom', {
      ...(input ?? {}),
      dimensionId,
      baseOnly,
      derivedOnly,
    });
  }

  @Query(() => SelectOptions, { name: 'suppliersOptions' })
  suppliersOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY suppliersOptions');
    return this.nats.send<SelectOptions>('commerce', 'select.suppliers', input ?? {});
  }

  @Query(() => SelectOptions, { name: 'taxGroupsOptions' })
  taxGroupsOptions(
    @Args('input', { type: () => SelectOptionsInput, nullable: true }) input?: SelectOptionsInput,
  ): Promise<SelectOptions> {
    this.logger.log('QUERY taxGroupsOptions');
    return this.nats.send<SelectOptions>('commerce', 'select.taxGroups', input ?? {});
  }
}
