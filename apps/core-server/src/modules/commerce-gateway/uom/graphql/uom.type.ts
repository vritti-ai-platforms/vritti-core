import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

// Mirrors UomResponseDto — a unit of measure within a dimension, for the mobile units screen. A unit is a
// BASE unit when baseUnitId is null, otherwise DERIVED (converts to its base). Conversion: `uomQty` units of
// THIS unit equal `baseUomQty` units of the base (e.g. 1000 g = 1 kg → uomQty=1000, baseUomQty=1). createdAt
// is an ISO String (the gateway response carries ISO strings, not Date objects).
@ObjectType()
export class Uom {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  dimensionId: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  symbol: string;

  @Field(() => ID, { nullable: true })
  baseUnitId: string | null;

  @Field(() => String, { nullable: true })
  baseUnitSymbol: string | null;

  @Field(() => Int)
  baseUomQty: number;

  @Field(() => Int)
  uomQty: number;

  @Field(() => Boolean)
  canEdit: boolean;

  @Field(() => Boolean)
  canDelete: boolean;

  @Field(() => String)
  createdAt: string;
}
