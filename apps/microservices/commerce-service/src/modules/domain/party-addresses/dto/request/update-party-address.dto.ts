import { PartyFunctionAssignmentInput } from '@domain/party-functions/dto/request/party-function-assignment-input.dto';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, Length, MaxLength, ValidateNested } from 'class-validator';

export class UpdatePartyAddressDto {
  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  line1?: string;

  @Trim()
  @IsOptional()
  @IsString()
  line2?: string;

  @Trim()
  @IsOptional()
  @IsString()
  city?: string;

  @Trim()
  @IsOptional()
  @IsString()
  region?: string;

  @Trim()
  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartyFunctionAssignmentInput)
  functions?: PartyFunctionAssignmentInput[];
}
