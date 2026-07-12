import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

// Major-unit money pair (value is a string, mirroring CurrencyAmountDto / SupplierUnitPrice).
@ObjectType()
export class GoodsReceiptMoney {
  @Field(() => String)
  currency: string;

  @Field(() => String)
  value: string;
}

@ObjectType()
export class GoodsReceiptPo {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  poNumber: string;

  @Field(() => String)
  orderDate: string;

  @Field(() => String, { nullable: true })
  expectedBy: string | null;

  @Field(() => GoodsReceiptMoney)
  totalAmount: GoodsReceiptMoney;
}

// One goods receipt for the mobile list + detail. `status` is DRAFT | PUBLISHED (String; the client narrows
// to a union). `po` is null when no purchase order is linked.
@ObjectType()
export class GoodsReceipt {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  grNumber: string;

  @Field(() => String)
  supplierId: string;

  @Field(() => String)
  supplierName: string;

  @Field(() => String)
  supplierCurrencyCode: string;

  @Field(() => String)
  status: string;

  @Field(() => GoodsReceiptPo, { nullable: true })
  po: GoodsReceiptPo | null;

  @Field(() => String)
  receivedDate: string;

  @Field(() => String, { nullable: true })
  notes: string | null;

  @Field(() => Float)
  exchangeRate: number;

  @Field(() => String, { nullable: true })
  publishedAt: string | null;

  @Field(() => String)
  createdAt: string;
}
