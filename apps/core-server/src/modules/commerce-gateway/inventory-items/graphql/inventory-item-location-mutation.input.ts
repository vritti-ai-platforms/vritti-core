import { Field, Float, ID, InputType } from '@nestjs/graphql';
import { IsNumber, IsUUID, Min } from 'class-validator';

// Mirror the item-location create/update payloads so the resolver forwards straight to
// gateway.createItemLocation/updateItemLocation. reorderLevel ("Min. Stock Level") is a decimal ≥ 0.
@InputType()
export class CreateInventoryItemLocationInput {
  @Field(() => ID)
  @IsUUID()
  locationId: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  reorderLevel: number;
}

@InputType()
export class UpdateInventoryItemLocationInput {
  @Field(() => Float)
  @IsNumber()
  @Min(0)
  reorderLevel: number;
}
