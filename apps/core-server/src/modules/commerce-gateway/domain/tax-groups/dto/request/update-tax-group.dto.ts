import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsCode, Trim } from '@vritti/api-sdk/decorators';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { TAX_TREATMENTS } from '../response/tax-group-response.dto';

export class UpdateTaxGroupDto {
  @ApiPropertyOptional({ description: 'Code, unique within the group’s country', example: 'gst-5' })
  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsCode()
  code?: string;

  @ApiPropertyOptional({ description: 'Tax group name' })
  @Trim({ nullify: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'How supplies in the group are treated', enum: TAX_TREATMENTS })
  @IsOptional()
  @IsIn(TAX_TREATMENTS)
  treatment?: (typeof TAX_TREATMENTS)[number];

  @ApiPropertyOptional({ description: 'Text printed on documents; null clears it', nullable: true })
  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  legalText?: string | null;
}
