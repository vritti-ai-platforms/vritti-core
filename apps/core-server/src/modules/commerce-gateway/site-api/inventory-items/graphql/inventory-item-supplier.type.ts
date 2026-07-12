import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

// Money pair (major-unit string + currency code) — mirrors api-sdk CurrencyAmountDto so the mobile formatter
// (useFormatters) can render it.
@ObjectType()
export class SupplierUnitPrice {
  @Field(() => String)
  currency: string;

  @Field(() => String)
  value: string;
}

// A supplier link for an inventory item (the read-only "Suppliers" tab). Has a unique `id`
// (supplier_items row), so no composite id is needed for cache normalization.
@ObjectType()
export class InventoryItemSupplier {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  supplierId: string;

  @Field(() => String, { nullable: true })
  supplierName: string | null;

  @Field(() => String, { nullable: true })
  supplierCode: string | null;

  @Field(() => String, { nullable: true })
  supplierItemCode: string | null;

  @Field(() => SupplierUnitPrice, { nullable: true })
  unitPrice: SupplierUnitPrice | null;

  @Field(() => ID)
  uomId: string;

  @Field(() => String)
  uomSymbol: string;

  @Field(() => Float, { nullable: true })
  minOrderQuantity: number | null;

  @Field(() => Int, { nullable: true })
  leadTimeDays: number | null;

  @Field(() => Boolean)
  isPreferred: boolean;

  @Field(() => Boolean)
  isActive: boolean;
}

// Relay Cursor Connection — supplier-scoped names to avoid global type-name collisions (code-first).
@ObjectType()
export class InventoryItemSupplierPageInfo {
  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => String, { nullable: true })
  endCursor: string | null;
}

@ObjectType()
export class InventoryItemSupplierEdge {
  @Field(() => String)
  cursor: string;

  @Field(() => InventoryItemSupplier)
  node: InventoryItemSupplier;
}

@ObjectType()
export class InventoryItemSupplierConnection {
  @Field(() => [InventoryItemSupplierEdge])
  edges: InventoryItemSupplierEdge[];

  @Field(() => InventoryItemSupplierPageInfo)
  pageInfo: InventoryItemSupplierPageInfo;
}
