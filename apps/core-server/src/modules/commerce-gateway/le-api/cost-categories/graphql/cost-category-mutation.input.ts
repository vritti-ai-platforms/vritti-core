import { Field, InputType } from '@nestjs/graphql';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { COST_CATEGORY_KINDS, type CostCategoryKind } from '@commerce/cost-categories/dto/request/create-cost-category.dto';

// Mirror create-/update-cost-category.dto.ts. `code` + `kind` are immutable after create (only name +
// isActive are updatable), so UpdateCostCategoryInput is explicit — NOT PartialType of the create input.
@InputType()
export class CreateCostCategoryInput {
  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code: string;

  @Field(() => String)
  @Trim({ nullify: false })
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
  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
