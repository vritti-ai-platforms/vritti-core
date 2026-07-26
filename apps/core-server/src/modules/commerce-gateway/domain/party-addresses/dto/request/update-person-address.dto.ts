import { ApiPropertyOptional } from '@nestjs/swagger';
import { Trim } from '@vritti/api-sdk/decorators';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, Length, MaxLength, ValidateNested } from 'class-validator';
import { PartyFunctionAssignmentDto } from '@/modules/commerce-gateway/_shared/dto/party-function-assignment.dto';

export class UpdatePersonAddressDto {
  @Trim({ nullify: false })
  @ApiPropertyOptional({ description: 'Address line 1', example: '221B Baker Street' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  line1?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Address line 2' })
  @IsOptional()
  @IsString()
  line2?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Region, state, or province' })
  @IsOptional()
  @IsString()
  region?: string;

  @Trim()
  @ApiPropertyOptional({ description: 'Postal or ZIP code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'ISO 3166-1 alpha-2 country code', example: 'IN' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @ApiPropertyOptional({
    type: [PartyFunctionAssignmentDto],
    description: 'Address functions assigned to this address',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartyFunctionAssignmentDto)
  functions?: PartyFunctionAssignmentDto[];
}
