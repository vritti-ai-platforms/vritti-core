import { Field, ID, InputType, Int, PartialType } from '@nestjs/graphql';
import { Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';

// Mirror create-/update-uom.dto.ts so the resolver forwards an input straight to gateway.create/update.
// baseUnitId null/omitted → this is a BASE unit; set → DERIVED with the uomQty:baseUomQty ratio.
@InputType()
export class CreateUomInput {
  @Field(() => ID)
  @IsUUID()
  dimensionId: string;

  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  symbol: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  baseUnitId?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  baseUomQty?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @IsPositive()
  uomQty?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  allowDecimal?: boolean;
}

// All fields optional for a partial update (PartialType keeps the @Field metadata).
@InputType()
export class UpdateUomInput extends PartialType(CreateUomInput) {}
