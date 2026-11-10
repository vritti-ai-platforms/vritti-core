import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

// One goods receipt for the mobile list + detail.
@ObjectType()
export class GoodsReceipt {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  grNumber: string;

  @Field(() => ID)
  legalEntityId: string;

  @Field(() => ID)
  siteId: string;

  @Field(() => String)
  supplierId: string;

  @Field(() => String)
  supplierName: string;

  @Field(() => String)
  status: string;

  @Field(() => Boolean)
  isPublishable: boolean;

  @Field(() => Int)
  itemCount: number;

  @Field(() => ID)
  inboundDeliveryId: string;

  @Field(() => String)
  deliveryNumber: string;

  @Field(() => String)
  deliverySource: string;

  @Field(() => String, { nullable: true })
  carrier: string | null;

  @Field(() => String, { nullable: true })
  trackingNumber: string | null;

  @Field(() => String, { nullable: true })
  supplierDeliveryNoteNumber: string | null;

  @Field(() => String, { nullable: true })
  supplierDeliveryNoteDate: string | null;

  @Field(() => [String])
  poNumbers: string[];

  @Field(() => String, { nullable: true })
  expectedDeliveryDate: string | null;

  @Field(() => String)
  receivedDate: string;

  @Field(() => String, { nullable: true })
  notes: string | null;

  @Field(() => String, { nullable: true })
  publishedAt: string | null;

  @Field(() => String)
  createdAt: string;
}
