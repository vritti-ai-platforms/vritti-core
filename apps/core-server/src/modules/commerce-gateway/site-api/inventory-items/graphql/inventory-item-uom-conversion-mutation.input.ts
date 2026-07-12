import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsUUID, Min } from 'class-validator';

// Mirror create-/update-inventory-item-uom-conversion.dto.ts so the resolver forwards an input straight to
// gateway.createUomConversion/updateUomConversion. Ratio semantics: `uomQty` of the alternative UOM equals
// `primaryUomQty` of the item's primary UOM (e.g. 1 Strip = 14 Each → uomQty=1, primaryUomQty=14).
@InputType()
export class CreateInventoryItemUomConversionInput {
  @Field(() => String)
  @IsUUID()
  uomId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  primaryUomQty: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  uomQty: number;
}

@InputType()
export class UpdateInventoryItemUomConversionInput {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  primaryUomQty: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  uomQty: number;
}
