import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { PartyFunctionAssignmentDto } from '@/modules/commerce-gateway/_shared/dto/party-function-assignment.dto';

export class UpdateCompanyPersonDto {
  @Trim()
  @ApiPropertyOptional({ description: 'Job title of the person at the company' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string | null;

  @ApiPropertyOptional({ description: 'Whether the relationship is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [PartyFunctionAssignmentDto], description: 'Contact functions assigned to this person' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartyFunctionAssignmentDto)
  functions?: PartyFunctionAssignmentDto[];
}
