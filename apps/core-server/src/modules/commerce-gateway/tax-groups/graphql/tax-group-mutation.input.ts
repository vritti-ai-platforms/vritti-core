import { Field, Float, InputType, PartialType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

// Mirror create-/update-tax-group.dto.ts so the resolver forwards an input straight to gateway.create/update.
// Create/update send the FULL taxRates array (the microservice replaces all rates on update); sortOrder is
// derived server-side from array position, so it's not part of the input.
@InputType()
export class TaxRateInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Field(() => Float)
  @IsNumber({ maxDecimalPlaces: 2 })
  rate: number;
}

@InputType()
export class CreateTaxGroupInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Field(() => [TaxRateInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxRateInput)
  taxRates: TaxRateInput[];
}

// name + taxRates optional (PartialType keeps @Field metadata) + an isActive toggle for the edit form.
@InputType()
export class UpdateTaxGroupInput extends PartialType(CreateTaxGroupInput) {
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
