import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

// Mirrors TaxGroupResponseDto — the Tax Group cards the mobile Tax Groups screen lists. A group has a name,
// an active flag, a canDelete flag (false when referenced by an inventory item or offering), and its tax
// rates. There is NO server `total` — the client sums `rate` across `taxRates`.
@ObjectType()
export class TaxRate {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  // Percentage (decimal, up to 2 dp) — e.g. 9 or 2.5.
  @Field(() => Float)
  rate: number;

  @Field(() => Int)
  sortOrder: number;
}

@ObjectType()
export class TaxGroup {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Boolean)
  canDelete: boolean;

  @Field(() => [TaxRate])
  taxRates: TaxRate[];
}
