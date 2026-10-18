import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

// Mirrors UomResponseDto — a unit of measure within a dimension, for the mobile units screen.
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
