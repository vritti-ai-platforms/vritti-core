import { Field, InputType } from '@nestjs/graphql';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const ITEM_TYPES = ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'];
const TRACKING_TYPES = ['quantity', 'lot', 'lot_serial', 'serial'];
const PICK_STRATEGIES = ['none', 'fifo', 'fefo'];

@InputType()
export class CreateInventoryItemInput {
  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Field(() => String)
  @Trim({ nullify: false })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsCode()
  code: string;

  @Field(() => String)
  @IsEnum(ITEM_TYPES)
  type: string;

  @Field(() => String)
  @IsEnum(TRACKING_TYPES)
  tracking: 'quantity' | 'lot' | 'lot_serial' | 'serial';

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(PICK_STRATEGIES)
  pickStrategy?: 'none' | 'fifo' | 'fefo';

  @Field(() => String)
  @IsUUID()
  categoryId: string;

  @Field(() => String, { nullable: true })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @Field(() => String)
  @IsUUID()
  uomId: string;

  @Field(() => String)
  @IsUUID()
  purchaseTaxGroupId: string;

  @Field(() => String, { nullable: true })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;
}

@InputType()
export class UpdateInventoryItemInput {
  @Field(() => String, { nullable: true })
  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @Field(() => String, { nullable: true })
  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @IsCode()
  code?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(ITEM_TYPES)
  type?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @Field(() => String, { nullable: true })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUUID()
  uomId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(PICK_STRATEGIES)
  pickStrategy?: 'none' | 'fifo' | 'fefo';

  @Field(() => String)
  @IsUUID()
  purchaseTaxGroupId: string;

  @Field(() => String, { nullable: true })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;
}
