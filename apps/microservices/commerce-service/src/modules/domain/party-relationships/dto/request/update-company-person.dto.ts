import { PartyFunctionAssignmentInput } from '@domain/party-functions/dto/request/party-function-assignment-input.dto';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';

export class UpdateCompanyPersonDto {
  @IsUUID()
  id: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartyFunctionAssignmentInput)
  functions?: PartyFunctionAssignmentInput[];
}
