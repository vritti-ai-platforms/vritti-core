import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

const ITEM_CODE_PATTERN = /^[A-Z0-9-]+$/;
const ITEM_TYPES = ['RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE'];
const TRACKING_TYPES = ['quantity', 'lot', 'lot_serial', 'serial'];
const PICK_STRATEGIES = ['none', 'fifo', 'fefo'];

@InputType()
export class CreateInventoryItemInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(ITEM_CODE_PATTERN, { message: 'code must contain only uppercase letters, numbers, and hyphen (-).' })
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
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => String)
  @IsUUID()
  uomId: string;

  @Field(() => String)
  @IsUUID()
  purchaseTaxGroupId: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  hasMrp?: boolean;
}

@InputType()
export class UpdateInventoryItemInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(ITEM_CODE_PATTERN, { message: 'code must contain only uppercase letters, numbers, and hyphen (-).' })
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
  @IsOptional()
  @IsString()
  @MaxLength(20)
  hsnCode?: string | null;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  hasMrp?: boolean;
}
