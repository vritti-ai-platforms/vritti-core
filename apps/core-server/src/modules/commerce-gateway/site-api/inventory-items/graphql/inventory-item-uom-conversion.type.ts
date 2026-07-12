import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

// Mirrors InventoryItemUomConversionResponseDto — the per-item UOM conversion overrides the mobile detail
// tab lists. Date fields are String (ISO 8601): the gateway response carries ISO strings, not Date objects.
@ObjectType()
export class InventoryItemUomConversion {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  inventoryItemId: string;

  @Field(() => ID)
  uomId: string;

  @Field(() => String)
  uomName: string;

  @Field(() => String)
  uomSymbol: string;

  // Count of the item's PRIMARY UOM in the ratio (e.g. 1 Strip = 14 Each → primaryUomQty=14).
  @Field(() => Int)
  primaryUomQty: number;

  // Count of THIS (alternative) UOM in the ratio (1 Strip = 14 Each → uomQty=1).
  @Field(() => Int)
  uomQty: number;

  // Derived: 1 alt-UOM unit = factor primary units (primaryUomQty / uomQty).
  @Field(() => Float)
  toPrimaryConversionFactor: number;

  // Derived: 1 primary unit = factor alt-UOM units (uomQty / primaryUomQty).
  @Field(() => Float)
  toUomConversionFactor: number;

  @Field(() => Boolean)
  canEdit: boolean;

  @Field(() => Boolean)
  canDelete: boolean;

  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  updatedAt: string;
}
