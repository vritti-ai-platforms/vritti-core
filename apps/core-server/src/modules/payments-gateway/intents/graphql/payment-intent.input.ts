import { Field, ID, InputType, registerEnumType } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export enum PaymentChannel {
  APP = 'APP',
  POS = 'POS',
  B2B = 'B2B',
}

registerEnumType(PaymentChannel, { name: 'PaymentChannel' });

@InputType()
export class MoneyInput {
  @Field(() => String)
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be an ISO 4217 code' })
  currency: string;

  // Major units, e.g. "499.00"
  @Field(() => String)
  @Matches(/^\d{1,13}(\.\d{1,4})?$/, { message: 'value must be a positive decimal amount' })
  value: string;
}

@InputType()
export class PaymentReferenceInput {
  // What the payment is for, namespaced by the caller, e.g. booking or subscription.invoice
  @Field(() => String)
  @Matches(/^[a-z0-9][a-z0-9._-]{0,99}$/, {
    message: 'type must be lowercase letters, digits, dots, dashes or underscores',
  })
  type: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  id: string;
}

@InputType()
export class PaymentCustomerInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(200)
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

@InputType()
export class KeyValueInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  key: string;

  @Field(() => String)
  @IsString()
  @MaxLength(500)
  value: string;
}

@InputType()
export class CreatePaymentIntentInput {
  @Field(() => MoneyInput)
  @ValidateNested()
  @Type(() => MoneyInput)
  amount: MoneyInput;

  @Field(() => PaymentReferenceInput)
  @ValidateNested()
  @Type(() => PaymentReferenceInput)
  reference: PaymentReferenceInput;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => PaymentCustomerInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentCustomerInput)
  customer?: PaymentCustomerInput;

  // The caller's key for this payment; repeating it returns the same intent instead of charging twice
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  idempotencyKey: string;

  @Field(() => [KeyValueInput], { nullable: true })
  @IsOptional()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => KeyValueInput)
  metadata?: KeyValueInput[];

  @Field(() => PaymentChannel, { nullable: true, defaultValue: PaymentChannel.APP })
  @IsOptional()
  @IsEnum(PaymentChannel)
  channel?: PaymentChannel;
}

@InputType()
export class GatewayResponseInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  orderId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  paymentId: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  signature: string;
}

@InputType()
export class ConfirmPaymentInput {
  @Field(() => ID)
  @IsUUID()
  paymentIntentId: string;

  @Field(() => GatewayResponseInput)
  @ValidateNested()
  @Type(() => GatewayResponseInput)
  gatewayResponse: GatewayResponseInput;
}

@InputType()
export class PaymentIntentRefInput {
  @Field(() => ID)
  @IsUUID()
  paymentIntentId: string;
}

@InputType()
export class StartCheckoutInput {
  @Field(() => String)
  @Matches(/^[A-Z]{3}$/, { message: 'currencyCode must be an ISO 4217 code' })
  currencyCode: string;

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  idempotencyKey: string;
}
