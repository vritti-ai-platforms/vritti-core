import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { COST_CATEGORY_KINDS, type CostCategoryKind } from '../dto/request/create-cost-category.dto';

// Mirror create-/update-cost-category.dto.ts. `code` + `kind` are immutable after create (only name +
// isActive are updatable), so UpdateCostCategoryInput is explicit — NOT PartialType of the create input.
@InputType()
export class CreateCostCategoryInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_]+$/, { message: 'code must be uppercase letters, digits, or underscore' })
  code: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Field(() => String)
  @IsEnum(COST_CATEGORY_KINDS)
  kind: CostCategoryKind;
}

@InputType()
export class UpdateCostCategoryInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
