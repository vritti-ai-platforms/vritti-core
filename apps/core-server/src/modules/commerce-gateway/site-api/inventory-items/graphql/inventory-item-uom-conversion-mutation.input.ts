import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsUUID, Min } from 'class-validator';

// Mirror create-/update-inventory-item-uom-conversion.dto.ts so the resolver forwards an input straight to
// gateway.createUomConversion/updateUomConversion.
@InputType()
export class CreateInventoryItemUomConversionInput {
  @Field(() => String)
  @IsUUID('7')
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
